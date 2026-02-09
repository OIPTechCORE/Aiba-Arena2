const mongoose = require('mongoose');

const AdminAuditSchema = new mongoose.Schema(
    {
        adminEmail: { type: String, default: '', trim: true },
        adminRole: { type: String, default: '', trim: true },
        method: { type: String, default: '', trim: true },
        path: { type: String, default: '', trim: true },
        status: { type: Number, default: 0 },
        ip: { type: String, default: '', trim: true },
        requestId: { type: String, default: '', trim: true },
        durationMs: { type: Number, default: 0 },
        query: { type: Object, default: {} },
        params: { type: Object, default: {} },
        body: { type: Object, default: {} },
    },
    { timestamps: true },
);

AdminAuditSchema.index({ createdAt: -1 });
AdminAuditSchema.index({ adminEmail: 1, createdAt: -1 });

module.exports = mongoose.model('AdminAudit', AdminAuditSchema);
