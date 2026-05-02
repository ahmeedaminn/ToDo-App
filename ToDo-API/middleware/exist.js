import { asAppError } from "../utils/appError.js";

export const exist = (prismaModel) => {
  return async (req, res, next) => {
    try {
      let doc;
      if (req.params.id) {
        doc = await prismaModel.findUnique({ where: { id: req.params.id } });
        if (!doc) {
          return next(
            asAppError({
              status: 404,
              code: "NOT_FOUND",
              message: "Resource with given ID was not found",
              details: { id: req.params.id },
            }),
          );
        }
      } else if (req.params.username) {
        doc = await prismaModel.findUnique({
          where: { username: req.params.username },
        });
        //
        if (!doc) {
          return next(
            asAppError({
              status: 404,
              code: "NOT_FOUND",
              message: "Resource with given username was not found",
              details: { username: req.params.username },
            }),
          );
        }
      }
      req.doc = doc;
      next();
    } catch (err) {
      next(err);
    }
  };
};
