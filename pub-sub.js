var mqtt = require('mqtt')
var bodyParser = require("body-parser");
const express = require('express')
const app = express()
const port = process.env.PORT || 5000;
const cors = require('cors');
const city = require('./models/city');
const history = require('./models/history');
const cityController = require('./controller/cityController');
var path=require('path');

//Import the mongoose module
var mongoose = require('mongoose');
const { Console } = require('console');

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
        let a = "";
        let date_ob = new Date();
        let getMonth = date_ob.getUTCMonth();
        let getDate = date_ob.getUTCDate();

        if (getMonth < 10 && getDate < 10) {
            a = `${date_ob.getFullYear()}-0${date_ob.getMonth()+1}-0${date_ob.getDate()}T00:00:00.000+00:00`;
        } else if (getMonth < 10 && getDate >= 10) {
            a = `${date_ob.getFullYear()}-0${date_ob.getMonth()+1}-${date_ob.getDate()}T00:00:00.000+00:00`;
        }else if (getMonth >= 10 && getDate < 10) {
            a = `${date_ob.getFullYear()}-${date_ob.getMonth()+1}-0${date_ob.getUTCDate()}T00:00:00.000+00:00`;
        } else {
            a = `${date_ob.getFullYear()}-${date_ob.getMonth()+1}-${date_ob.getUTCDate()}T00:00:00.000+00:00`;
        }
        console.log("a", a)
        history.find({
            "name": dataMessage.name,
            "date": {
                "$gt": new Date(a),
                "$lt": new Date(),
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
       console.log("calculatorAQIByPM(aqi) sau", dataMessage);
        
    } catch (e) {
        console.log("error mess")
    }
})

client.on('close', () => {
    console.log(`disconnected mqtt`);
});
// subscribe to topic 'my/test/topic'
client.subscribe('mytopic');
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

app.get('/api', (req, res) => {
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
    if (getMonth < 10 && getDate <= 10) {
        a = `${date_ob.getUTCFullYear()}-0${date_ob.getUTCMonth()+1}-0${date_ob.getUTCDate()-1}T17:00:00.000+00:00`;
    } else if (getMonth < 10 && getDate > 10) {
        a = `${date_ob.getUTCFullYear()}-0${date_ob.getUTCMonth()+1}-${date_ob.getUTCDate()-1}T17:00:00.000+00:00`;
    }else if (getMonth >= 10 && getDate <= 10) {
        a = `${date_ob.getUTCFullYear()}-${date_ob.getUTCMonth()+1}-0${date_ob.getUTCDate()-1}T17:00:00.000+00:00`;
    } else {
        a = `${date_ob.getUTCFullYear()}-${date_ob.getUTCMonth()+1}-${date_ob.getUTCDate()-1}T17:00:00.000+00:00`;
    }
    const city_name = req.query.name;
    history.find({
        "name": city_name,
        "date": {
            "$gt": new Date(a),
            "$lt": new Date(),
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
    client.publish('mytopic', dataPush);
    // console.log("req.body.message");
    res.send({
        message: dataPush
    });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

//https://tttrangweb-aqi.herokuapp.com/