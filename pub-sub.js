require('dotenv').config()
var mqtt = require('mqtt')
var bodyParser = require("body-parser");
const express = require('express')
const app = express()
const port = process.env.PORT || 5000;
const cors = require('cors');
const city = require('./models/city');
const User = require('./models/user');
const history = require('./models/history');
const cityController = require('./controller/cityController');
var path=require('path');
const dayjs = require('dayjs')
const server = require("http").Server(app);
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock user data
const users = [
  { id: 1, username: 'user1@example.com', password: '$2b$10$mYFzDInpNn28BClNefRvJ.knB9Xpt44kZ5HL5NV5hJo/5PA3qLneK' }, // hashed password for "password1"
  { id: 2, username: 'user2@example.com', password: '$2b$10$6yaLXdvmC47ej6J2H6OY..6WXlU6pYno6jhInbkbGyTgILB1JeT0e' }, // hashed password for "password2"
];

const io = require("socket.io")(server, {
    cors: {
      origin: '*',
    }
  });

//Import the mongoose module
var mongoose = require('mongoose');

//Set up default mongoose connection
var mongoDB = "mongodb+srv://trangnt:trangtute@cluster0.zdvmv.mongodb.net/esp32?retryWrites=true&w=majority";
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Successfully connect to MongoDB.");
    });

//Get the default connection
var db = mongoose.connection

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
let date_ob = new Date();

function getSumPM(total, num) {
    return total + Number(num.pm25);
}

function calculatorAQIByPM(x) {
    if (x < 12.1) {
        return Math.round(50 / 12 * (x - 12));
    } else if (x < 35.5) {
        return Math.round((100 - 51) / (35.4 - 12.1) * (x - 12.1) + 51);
    } else if (x < 55.5) {
        return Math.round((150 - 101) / (55.4 - 35.5) * (x - 35.5) + 101);
    } else if (x < 150.5) {
        return Math.round((200 - 151) / (150.4 - 55.5) * (x - 55.5) + 151);
    } else if (x < 250.5) {
        return Math.round((300 - 201) / (259.4 - 150.5) * (x - 150.5) + 201);
    } else if (x < 350.5) {
        return Math.round((400 - 301) / (350.4 - 250.5) * (x - 250.5) + 301);
    } else {
        return Math.round((500 - 401) / (500.4 - 350.5) * (x - 350.5) + 401);
    }
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

var options = {
    // host: '68c31a99590a4e37b25ad1b5789d04df.s1.eu.hivemq.cloud',
    // port: 8883,
    // protocol: 'mqtts',
    // username: 'trangbg20@gmail.com',
    // password: 'Trang2000'
    // host: '172.20.10.6',
    // port: 1883,
    // protocol: 'TCP',
    host: 'broker.hivemq.com',
    port: 1883,
    protocol: 'TCP',
}

//initialize the MQTT client
var client = mqtt.connect(options);

//setup the callbacks
client.on('connect', function() {
    console.log('Connected mqtt');
});

client.on('error', function(error) {
    console.log(error);
});

//Called each time a message is received
client.on('message', function(topic, message) {
    try {
        console.log('Received message:', message.toString());
        const dataMessage = JSON.parse(message);
        dataMessage.humidity= parseFloat(dataMessage.humidity).toFixed(2);
        dataMessage.temperature= parseFloat(dataMessage.temperature).toFixed(2);
        dataMessage.co=parseFloat(dataMessage.co).toFixed(0); //parseInt(dataMessage.co,10);
        dataMessage.co2=parseFloat(dataMessage.co2).toFixed(0); 
        dataMessage.pm25= parseFloat(dataMessage.pm25).toFixed(2);
        dataMessage.date = new Date();
        // let a = "";
        // let date_ob = new Date();
        // let getMonth = date_ob.getUTCMonth();
        // let getDate = date_ob.getUTCDate();
        // if (getMonth < 10 && getDate <= 10) {
        //     a = `${date_ob.getUTCFullYear()}-0${date_ob.getUTCMonth()+1}-0${date_ob.getUTCDate()-1}T17:00:00.000+00:00`;
        // } else if (getMonth < 10 && getDate > 10) {
        //     a = `${date_ob.getUTCFullYear()}-0${date_ob.getUTCMonth()+1}-${date_ob.getUTCDate()-1}T17:00:00.000+00:00`;
        // }else if (getMonth >= 10 && getDate <= 10) {
        //     a = `${date_ob.getUTCFullYear()}-${date_ob.getUTCMonth()+1}-0${date_ob.getUTCDate()-1}T17:00:00.000+00:00`;
        // } else {
        //     a = `${date_ob.getUTCFullYear()}-${date_ob.getUTCMonth()+1}-${date_ob.getUTCDate()-1}T17:00:00.000+00:00`;
        // }
        // a= dayjs().startOf('day').format();
        // b= dayjs().format()
        // console.log(typeof a)

        history.find({
            "name": dataMessage.name,
            "date": {
                "$gt": dayjs().startOf('day').format(),
                "$lt": dayjs().format(),
            }
        })
        .then(data => {
            let aqi = data.reduce(getSumPM, 0) / data.length;
            dataMessage.AQI = calculatorAQIByPM(aqi)                
            console.log("calculatorAQIByPM(aqi)", dataMessage);
            const history1 = new history(dataMessage);
        // save model to database
            history1.save(function(err, history) {                
                if (err) return console.error(err);
            });
            cityController.updateMQTT(dataMessage);
        });
        
    } catch (e) {
        console.log("error mess")
    }
})

client.on('close', () => {
    console.log(`disconnected mqtt`);
});
// subscribe to topic 'my/test/topic'
client.subscribe('AQIDATN');
// publish message 'Hello' to topic 'my/test/topic'
// let dataPush = {
//     id: "62808211ee8fefe86e989d2e",
//     name: "hà nội",
//     humidity: 1000,
//     temperature: "300",
//     co: "26",
//     co2: "260",
//     pm25: "550",
//     pm10: "28",
//     date: new Date()
// };
// client.publish('mytopic', JSON.stringify(dataPush));
//create a server object:

io.of("/api/socket").on("connection", (socket) => {
    console.log("socket.io: User connected: ", socket.id);
  
    socket.on("disconnect", () => {
      console.log("socket.io: User disconnected: ", socket.id);
    });
  });

app.get('/api/city', (req, res) => {
    city.find(function(err, city) {
        if (err) {
            console.log(err);
        } else {
            res.json(city);
        }
    });
});

app.get('/api/name', (req, res) => {
    const city_name = req.query.name;
    city.findOne({ name: city_name }, function(err, city) {
        if (err) {
            console.log("err");
        } else {
            res.json(city);
        }
    });
    // res.json(cityController.getCity(city_name));
});

app.get('/api/history/name', (req, res) => {
    let a = "";
    let date_ob = new Date();
    let getMonth = date_ob.getUTCMonth() + 1;
    let getDate = date_ob.getUTCDate();

    // if (getMonth < 10 && getDate <= 10) {
    //     a = `${date_ob.getUTCFullYear()}-0${date_ob.getUTCMonth()+1}-0${date_ob.getUTCDate()-1}T17:00:00.000+00:00`;
    // } else if (getMonth < 10 && getDate > 10) {
    //     a = `${date_ob.getUTCFullYear()}-0${date_ob.getUTCMonth()+1}-${date_ob.getUTCDate()-1}T17:00:00.000+00:00`;
    // }else if (getMonth >= 10 && getDate <= 10) {
    //     a = `${date_ob.getUTCFullYear()}-${date_ob.getUTCMonth()+1}-0${date_ob.getUTCDate()-1}T17:00:00.000+00:00`;
    // } else {
    //     a = `${date_ob.getUTCFullYear()}-${date_ob.getUTCMonth()+1}-${date_ob.getUTCDate()-1}T17:00:00.000+00:00`;
    // }

    const city_name = req.query.name;
    // history.find({
    //     "name": city_name,
    //     "date": {
    //         "$gt": new Date(a),
    //         "$lt": new Date(),
    //     }
    a= dayjs().startOf('day').format();
    b= dayjs().format()

    history.find({
        "name": city_name,
        "date": {
            "$gt": dayjs().startOf('day').format(),
            "$lt": dayjs().format(),
        }
    }, function(err, history) {
        if (err) {
            console.log(err);
        } else {
            res.json(history);
        }
    })
});

app.post('/api/history', (req, res) => {
    const {body} =  req
    const startDate= body.startDate
    const endDate= body.endDate
    const city_name = body.name;
    a= dayjs().startOf('day').format();
    b= dayjs().format()

    history.find({
        "name": city_name,
        "date": {
            "$gt": dayjs(startDate).startOf('day').format(),
            "$lt": dayjs(endDate).endOf('day').format(),
        }
    }, function(err, history) {
        if (err) {
            console.log(err);
        } else {
            res.json(history);
        }
    })
});

app.get('/api/history', (req, res) => {
    const {body} =  req
    const startDate= body.startDate
    const endDate= body.endDate
    const city_name = body.name;
    a= dayjs().startOf('day').format();
    b= dayjs().format()

    history.find({
        "name": city_name,
        "date": {
            "$gt": dayjs(startDate).startOf('day').format(),
            "$lt": dayjs(endDate).endOf('day').format(),
        }
    }, function(err, history) {
        if (err) {
            console.log(err);
        } else {
            res.json(history);
        }
    })
});

app.get("/api/send", function(req, res) {
    client.publish('AQIDATN', dataPush);
    res.send({
        message: dataPush
    });
});

// app.post('/login', (req, res) => {
//     // Find user by username
//     const user = users.find(user => user.username === req.body.username);
//     if (!user) return res.status(404).json({ message: 'User not found' });
  
//     // Check password
//     bcrypt.compare(req.body.password, user.password, (err, result) => {
//       if (err) return res.status(500).json({ message: err.message });
//       if (!result) return res.status(401).json({ message: 'Incorrect password' });
  
//       // Generate JWT token
//       const token = jwt.sign({ userId: user.id }, 'secret', { expiresIn: '1h' });
//       res.json({ token });
//     });
//   });

  app.post('/api/login', async (req, res) => {

    const { username, password } = req.body;

    try {
        // Tìm user trong cơ sở dữ liệu
        const user = await User.findOne({ username });

        if (!user) {
        return res.status(401).json({ message: 'Username không tồn tại' });
        }
        
        console.log({user})

        // So sánh mật khẩu đã được mã hóa trong cơ sở dữ liệu với mật khẩu cung cấp bởi người dùng
        const isMatch = await bcrypt.compare(password, user.password);
       
        // const isMatch = password === user.password;

        if (!isMatch) {
        return res.status(401).json({ message: 'Mật khẩu không đúng' });
        }

        // Nếu đăng nhập thành công, tạo token
        const token = jwt.sign({ username: user.username , role: user.role}, process.env.JWT_KEY, {
        expiresIn: '1h',
        });

        res.json({ message: 'Đăng nhập thành công', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
  });  


    app.post('/api/register', async (req, res) => {
        try {
        const { username, password, role } = req.body;

        // Kiểm tra xem username đã tồn tại trong database chưa
        const userExist = await User.findOne({ username });
        if (userExist) {
        return res.status(400).json({ message: 'Username đã tồn tại' });
        }

        // Hash mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Tạo user mới với vai trò 'user'
        // const user = new User({
        //     username,
        //     password: password,
        //     role,
        // });

        const user = new User({
          username,
          password: hashedPassword,
          role,
        });

        // Lưu user vào database
        await user.save();

        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_KEY);
        //   const token = jwt.sign({ userId: user._id, username:  role: user.role}, 'secret');
        res.status(201).json({ message: 'Đăng ký thành công', token });
        } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server' });
        }
    });

    // app.get('/api/users', async (req, res) => {
    //     try {
    //       const users = await User.find({});
    //       res.status(200).json(users);
    //     } catch (err) {
    //       console.error(err);
    //       res.status(500).json({ message: 'Internal Server Error' });
    //     }
    //   });
    const requireAuth = (req, res, next) => {
        const token = req.headers.authorization;
        console.log({token})
        if (!token) {
          return res.status(401).json({ message: "Bạn chưa đăng nhập" });
        }
        try {
          const decodedToken = jwt.verify(token.split(" ")[1], process.env.JWT_KEY);
          req.user = decodedToken;
          console.log({decodedToken})
          if(decodedToken.role === "admin")  return next();
          else res.status(401).json({ message: "Token không hợp lệ" });
        } catch (err) {
          console.error(err);
          return res.status(401).json({ message: "Token không hợp lệ" });
        }
    };
      
      // API get list user
      app.get("/api/users", requireAuth, async (req, res) => {
        try {
          const users = await User.find();
          res.status(200).json(users);
        } catch (err) {
          console.error(err);
          res.status(500).json({ message: "Lỗi server" });
        }
      });

      app.delete('/api/users/:userId', requireAuth, async (req, res) => {
        const userId = req.params.userId;
        try {
            const deletedUser = await User.findOneAndDelete({ _id: userId });
        
            if (!deletedUser) {
              return res.status(404).json({ message: "User không tồn tại" });
            }
        
            return res.status(200).json({ message: "Xóa user thành công" });
          } catch (err) {
            console.error(err);
            return res.status(500).json({ message: "Lỗi server" });
          }
      });

      app.get('/api/users/:userId', async (req, res) => {
        const userId = req.params.userId;
      
        try {
          const user = await User.findById({ _id: userId });
      
          if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
          }
      
          res.json(user);
        } catch (err) {
          console.error(err);
          res.status(500).json({ message: 'Server error' });
        }
      });
      

      app.put('/api/users/:id', requireAuth, async (req, res) => {
        const { id } = req.params;
        const { name, username } = req.body;
      
        try {
          // Check if user has permission to update user info
          if (req.user.role !== 'admin' && req.user._id !== id) {
            return res.status(401).json({ message: 'Bạn không có quyền chỉnh sửa thông tin người dùng này.' });
          }
      
          // Update user information in MongoDB
          const user = await User.findByIdAndUpdate(id, { name, username }, { new: true });
      
          if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại.' });
          }
      
          res.json(user);
        } catch (err) {
          console.error(err);
          res.status(500).json({ message: 'Đã xảy ra lỗi khi chỉnh sửa thông tin người dùng.' });
        }
      });

//   app.get('/users', authenticateToken, (req, res) => {
//     if (req.user.permissions.role !== 'admin') {
//       return res.status(403).json({ message: 'Unauthorized' });
//     }
  
//     User.find({}).then((users) => {
//       res.json(users); // Return list of users as JSON
//     }).catch((err) => {
//       res.status(500).json({ message: err.message });
//     });
//   });
  

server.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

db.once("open", () => {
    console.log("MongoDB database connected");
  
    console.log("Setting change streams");
    const cityChangeStream = db.collection("city").watch();

    cityChangeStream.on("change", (change) => {

      switch (change.operationType) {
        case "insert":{
            const newCity = {
                _id: change.fullDocument._id,
                name: change.fullDocument.name,
                humidity: change.fullDocument.humidity,
                co2: change.fullDocument.co2,
                co: change.fullDocument.co,
                pm25: change.fullDocument.pm25,
                AQI: change.fullDocument.AQI,
                img: change.fullDocument.img,
              };
              io.of("/api/socket").emit("newCity", city);
            break;
        }
        case "update":{
            // const city = {
            //     _id: change.fullDocument._id,
            //     name: change.fullDocument.name,
            //     humidity: change.fullDocument.humidity,
            //     co2: change.fullDocument.co2,
            //     co: change.fullDocument.co,
            //     pm25: change.fullDocument.pm25,
            //     pm10: change.fullDocument.pm10,
            //     AQI: change.fullDocument.AQI,
            //     img: change.fullDocument.img,
            //   };
      
              io.of("/api/socket").emit("updateCity", "update");
              break;
        }
          case 'delete': {
            console.log('a delete happened...');

            io.of("/api/socket").emit('deleteCity', {
              type: 'delete',
              deletedId: change.documentKey._id,
              msg: 'Question has been deleted.'
            });
            break;
          }
          default:
            break;
      }
    });

    const histotyChangeStream = db.collection("history").watch();

    histotyChangeStream.on("change", (change) => {
        switch (change.operationType) {
          case "insert":{
              const newHistory = {
                  _id: change.fullDocument._id,
                  name: change.fullDocument.name,
                  date: change.fullDocument.date,
                  humidity: change.fullDocument.humidity,
                  co2: change.fullDocument.co2,
                  co: change.fullDocument.co,
                  pm25: change.fullDocument.pm25,
                  AQI: change.fullDocument.AQI,
                };
                io.of("/api/socket").emit("newHistory", newHistory);
              break;
          }
            default:
              break;
        }
      });
  });
  

//https://tttrangweb-aqi.herokuapp.com/