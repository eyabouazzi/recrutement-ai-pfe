const logModel = require('../models/log.model');

async function savelog(params) {
    try {
        const log = new logModel({
            ...params
        })

        await log.save();
    } catch (error) {
        throw new Error(error.message)
    }
}

module.exports = { savelog }