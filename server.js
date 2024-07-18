const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define RSVP schema and model
const rsvpSchema = new mongoose.Schema({
  name: String,
  email: String,
  code: String,
});

const RSVP = mongoose.model('rsvp', rsvpSchema);

// Endpoint to handle RSVP submissions
app.post('/send-rsvp', async (req, res) => {
  const { name, email } = req.body;
  const code = uuidv4().slice(0, 8).toUpperCase();

  // Create a new RSVP entry
  const newRSVP = new RSVP({ name, email, code });

  try {
    await newRSVP.save();

    // Create the transporter with your email provider's settings
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS,
      },
    });

    // Email options
    let mailOptions = {
      from: {
        name: 'Olufunke & Omobolanle',
        address: process.env.EMAIL,
      },
      to: email,
      subject: 'RSVP Confirmation | Olufunke & Omobolanle',
      text: `Dear ${name},\n\nThank you for your RSVP! Your invite code is ${code}. Please find the wedding flyer attached.\n\nBest regards,\nOlufunke & Omobolanle`,
      attachments: [
        {
          filename: 'Wedding Invite.pdf',
          path: 'https://storage.googleapis.com/bpxls-original/Wedding%20Invite.pdf',
        },
      ],
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res
          .status(500)
          .json({ success: false, message: 'Error sending email', error });
      }
      res.status(200).json({ success: true, message: 'Email sent', info });
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Error saving RSVP', error });
  }
});

// Serve the frontend files if needed
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
