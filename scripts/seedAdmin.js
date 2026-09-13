require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');
const Admin = require('../models/adminModel');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (query) =>
  new Promise((resolve) => rl.question(query, (answer) => resolve(answer.trim())));

// Asks a question through the SAME readline interface, but mutes the
// output stream while the user types so characters aren't echoed.
const askHidden = (query) =>
  new Promise((resolve) => {
    const originalWrite = rl._writeToOutput;

    rl._writeToOutput = function (stringToWrite) {
      // Only suppress the actual typed characters — still show the prompt text once
      if (stringToWrite.startsWith(query) || stringToWrite.trim() === '') {
        rl.output.write(stringToWrite);
      }
      // otherwise: swallow it (this is where typed characters would've echoed)
    };

    rl.question(query, (answer) => {
      rl._writeToOutput = originalWrite; // restore normal echoing
      rl.output.write('\n');
      resolve(answer.trim());
    });
  });

const run = async () => {
  console.log('--- Create New Admin ---\n');

  const name = await ask('Full Name: ');
  const email = await ask('Email: ');
  const phone = await ask('Phone: ');
  const password = await askHidden('Password: ');
  const dept = await ask('Department (optional): ');
  const designation = await ask('Designation (optional): ');

  rl.close();

  if (!name || !email || !phone || !password) {
    console.log('\nName, email, phone, and password are all required. Nothing was saved.');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const exists = await Admin.findOne({
      $or: [{ email: email.toLowerCase() }, { phone }],
    });
    if (exists) {
      console.log('\nAn admin with this email or phone already exists.');
      process.exit(1);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = await Admin.create({
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      dept: dept || undefined,
      designation: designation || undefined,
    });

    console.log('\nAdmin created successfully:');
    console.log(`  Name:  ${admin.name}`);
    console.log(`  Email: ${admin.email}`);
    console.log(`  Phone: ${admin.phone}`);
    console.log(`  Dept:  ${admin.dept || '(not set)'}`);

    process.exit(0);
  } catch (error) {
    console.error('\nFailed to create admin:', error.message);
    process.exit(1);
  }
};

run();