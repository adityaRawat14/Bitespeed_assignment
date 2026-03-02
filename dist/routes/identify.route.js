"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const identify_service_1 = require("../services/identify.service");
const router = (0, express_1.Router)();
router.post("/identify", async (req, res) => {
    try {
        const { email, phoneNumber } = req.body;
        const result = await (0, identify_service_1.identifyContact)(email, phoneNumber);
        res.status(200).json(result);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
exports.default = router;
