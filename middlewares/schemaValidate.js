module.exports = (schema) => async (req, res, next) => {
    try {
      // const isDataValid = await createUserSchema.isValid(req.body); - return boolean
      // if (!isDataValid) {
      //   res.status(422).json({ message: 'User data is invalid' });
      //   return;
      // }
  
      await schema.validate(req.body, { abortEarly: false });
      next();
    } catch (error) {
      res.status(422).json(error);
    }
  };