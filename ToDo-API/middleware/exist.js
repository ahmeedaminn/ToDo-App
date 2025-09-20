export const exist = (Model) => {
  return async (req, res, next) => {
    try {
      let doc;
      if (req.params.id) {
        doc = await Model.findById(req.params.id);
        if (!doc)
          return res
            .status(404)
            .json({ error: "ERROR 404, Resource with given ID is NOT found" });
      } else if (req.params.username) {
        doc = await Model.findOne({ username: req.params.username });
        //
        if (!doc)
          return res.status(404).json({
            error: "ERROR 404, Resource with given username is NOT found",
          });
      }
      req.doc = doc;
      next();
    } catch (err) {
      next(err);
    }
  };
};
