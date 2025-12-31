const AppError = require("../utils/appErrors");
const catchAsync = require("../utils/catchAsync");
const filterObj = require("../utils/filterObject");

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError("No document found with that ID.", 404));
    }
    res.status(204).json({
      status: "success",
      data: null,
    });
  });

exports.updateOne = (Model, allowedFields = null) =>
  catchAsync(async (req, res, next) => {
    let data = req.body;
    if (allowedFields) {
      data = filterObj(req.body, ...allowedFields);
    }
    const doc = await Model.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      return next(new AppError("No document found with that ID.", 404));
    }
    res.status(200).json({
      status: "success",
      data: { data: doc },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: "success",
      data: { data: doc },
    });
  });
