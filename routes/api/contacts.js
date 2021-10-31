const express = require("express");
const contactsModel = require("../../models/contactsSchema");
const router = express.Router()

router.get('/', async (req, res, next) => {

  try{
    const contacts = await contactsModel.find();
    res.json({ message: contacts })
  } catch(error){
    res.status(500).send({message: 'error'})
    console.log(error)
  }

});

router.get('/:contactId', async (req, res, next) => {
  try{
    const contacts = await contactsModel.findById(contactId);
    res.json({ message: contacts })
  } catch(error){
    res.status(500).send({message: 'error'})
    console.log(error)
  }
})

// router.post('/', async (req, res, next) => {
//   const contact = new contactsModel(req.body);
  
//     try {
//       await contact.save();
//       res.json(user);
//     } catch (error) {
//       res.status(500).json(error);
//     }
// })

// router.delete('/:contactId', async (req, res, next) => {
//   res.json({ message: 'template message' })
// })

// router.patch('/:contactId', async (req, res, next) => {
//   res.json({ message: 'template message' })
// })

module.exports = router
