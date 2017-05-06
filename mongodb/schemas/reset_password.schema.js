'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ResetPasswordSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    code: {
        type: String,
        unique: true,
    }
},
{
    timestamps: true
});

mongoose.model('ResetSchema', ResetPasswordSchema);
