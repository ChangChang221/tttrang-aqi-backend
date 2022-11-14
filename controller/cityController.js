const city=require('../models/city');
const history=require('../models/history');
module.exports = {
    updateMQTT: async(dataUpdate) => {
        try {
            const doc = await city.update({
                _id: dataUpdate.id
            }, dataUpdate)
            .then(data =>{
            //    console.log("du lieu",data )
            });
            // const doc = await city.update({_id: '62808211ee8fefe86e989d2e'}, {humidity: '40'},{
            //     new: true
            //   })
            //   .then(data =>{
            //       console.log("data",data)
            //   });
            //   console.log("update success")
            city.find({})
            .then(data => {
            //   console.log("du lieu",data )
            })
            .catch(err => {
            console.log('err',err);
            })                  
        } catch (error) {
            console.log("loi")
        }
    }
}