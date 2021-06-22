const User = require("../model/user");

const findById = async (id) => {
  return await User.findById(id);
};

const findByEmail = async (email) => {
  return await User.findOne({ email });
};

const createUser = async (body) => {
  const user = new User(body);
  return await user.save();
};

const updateToken = async (id, token) => {
  return await User.updateOne({ _id: id }, { token });
};

const getCurrentUser = async (id) => {
  const { email, subscription } = await User.findOne(id);

  return { email, subscription };
};

const updateUserSubscription = async (id, body) => {
  const result = await User.findByIdAndUpdate(id, { ...body }, { new: true });

  return result;
};

const updateAvatar = async (id, avatar) => {
  return await User.updateOne({ _id: id }, { avatar });
};

const findByVerifyToken = async (verifyToken) => {
  return await User.findOne({ verifyToken });
};

const updateTokenVerify = async (id, verify, verifyToken) => {
  return await User.updateOne({ _id: id }, { verify, verifyToken });
};

module.exports = {
  findById,
  findByEmail,
  createUser,
  updateToken,
  getCurrentUser,
  updateUserSubscription,
  updateAvatar,
  findByVerifyToken,
  updateTokenVerify,
};
