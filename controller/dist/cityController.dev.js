"use strict";

var city = require('../models/city');

var history = require('../models/history');

module.exports = {
  updateMQTT: function updateMQTT(dataUpdate) {
    var doc;
    return regeneratorRuntime.async(function updateMQTT$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return regeneratorRuntime.awrap(city.update({
              _id: dataUpdate.id
            }, dataUpdate).then(function (data) {//    console.log("du lieu",data )
            }));

          case 3:
            doc = _context.sent;
            // const doc = await city.update({_id: '62808211ee8fefe86e989d2e'}, {humidity: '40'},{
            //     new: true
            //   })
            //   .then(data =>{
            //       console.log("data",data)
            //   });
            //   console.log("update success")
            city.find({}).then(function (data) {//   console.log("du lieu",data )
            })["catch"](function (err) {
              console.log('err', err);
            });
            _context.next = 10;
            break;

          case 7:
            _context.prev = 7;
            _context.t0 = _context["catch"](0);
            console.log("loi");

          case 10:
          case "end":
            return _context.stop();
        }
      }
    }, null, null, [[0, 7]]);
  }
};