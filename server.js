const express = require('express');
const cors = require('cors');
require('dotenv').config();

const quizRoutes = require('./routes/quizRoute');
const userRoutes = require('./routes/userRoute');

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

app.use('/quiz', quizRoutes);
app.use('/user', userRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
