export const exist = (Model) => {
  return async (req, res, next) => {
    const doc = await Model.findById(req.params.id);

    if (!doc)
      return res
        .status(404)
        .json({ error: "ERROR 404, Resource with given ID is NOT found" });

    req.doc = doc;

    next();
  };
};
