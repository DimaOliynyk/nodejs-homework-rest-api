const e = require('express');
const express = require('express');
const router = express.Router();
const fs = require('fs/promises');
const { nanoid } = require('nanoid');
const yup = require('yup');

const contsPath = './model/contacts.json';

const schemaValidate = require('../../middlewares/schemaValidate');

const createUserSchema = yup.object().shape({
  username: yup
    .string()
    .min(3, 'Username should be at least 3 characters long')
    .max(255)
    .required(),
  password: yup.string().min(6).required(),
  age: yup.number().min(14).required(),
  email: yup.string().email().required(),
});

const updateUserSchema = yup.object().shape({
  username: yup
    .string()
    .min(3, 'Username should be at least 3 characters long')
    .max(255),
  password: yup.string().min(6),
  age: yup.number().min(14),
  email: yup.string().email(),
});


router.get('/', async (req, res) => {
  try {
    let contacts = await fs.readFile(contsPath);
    contacts = JSON.parse(contacts);
    res.json(contacts);
  } catch (error) {
    res.status(500).send(error);
  }
})

router.get('/:contactId', async (req, res) => {
  try {
    let contacts = await fs.readFile(contsPath);
    contacts = JSON.parse(contacts);
    
    const targetCont = contacts.find((contact) => contact.id === +req.params.contactId);
    if (!targetCont) {
      res.status(404).json({ message: 'Not found!' });
    }

    res.json(targetCont);
  } catch (error) {
    res.status(500).send(error);
  }
})

router.post('/',schemaValidate(createUserSchema), async (req, res) => {
  try {
    let contacts = await fs.readFile(contsPath);
    contacts = JSON.parse(contacts);

    const newContact = {
      ...req.body,
      id: nanoid(),
    };

    contacts.push(newContact);

    await fs.writeFile(contsPath, JSON.stringify(contacts));

    res.status(201).json(newContact);
  } catch (error) {
    res.status(500).send(error);
  }
})

router.delete('/:contactId', async (req, res) => {
  try {
    let contacts = await fs.readFile(contsPath);
    contacts = JSON.parse(contacts);

    const targetCont = contacts.find((contact) => contact.id === +req.params.contactId);

    if (!targetCont) {
      res.status(404).json({ message: 'Not found!' });
    }

    contacts.map((el) => {
      if(el.id === targetCont.id){
        let pos = contacts.indexOf(el);

        contacts.splice(pos, 1)
        fs.writeFile(contsPath, JSON.stringify(contacts));
      }
    })

    res.status(200).json({message: "contact deleted"});
  } catch (error) {
    res.status(500).send(error);
  }
})

router.put('/:contactId',schemaValidate(updateUserSchema), async (req, res) => {
  try {
    let contacts = await fs.readFile(contsPath);
    contacts = JSON.parse(contacts); 

    const message = []
  
    contacts.map((el) => {
      if(el.id.toString() === req.params.contactId){
        const {name, email, phone} = req.body;

        el.name = name;
        el.email = email;
        el.phone = phone;

        targetCont = el;
      
        fs.writeFile(contsPath, JSON.stringify(contacts));
      } 
    })
  
    res.json(targetCont);
  } catch (error) {
    res.status(500).send(error);
  }
}); 

module.exports = router
