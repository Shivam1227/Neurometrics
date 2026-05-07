import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    label: { type: String },
    type: {
      type: String,
      enum: ['image', 'video', 'audio', 'interactive'],
      required: true,
    },
    url: { type: String, required: true },
    version: { type: String },
  },
  { timestamps: true }
);

export const Media = mongoose.model('Media', mediaSchema);
