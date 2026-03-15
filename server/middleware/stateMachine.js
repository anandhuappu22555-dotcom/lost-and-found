const CLAIM_STATUS_FLOW = {
    'verification_pending': ['verification_failed', 'admin_review'],
    'verification_failed': ['verification_pending'],
    'admin_review': ['approved', 'rejected'],
    'approved': ['completed'],
    'rejected': ['verification_pending', 'active'],
    'completed': []
};

const validateStatusTransition = (currentStatus, nextStatus) => {
    if (!currentStatus || !nextStatus) return false;
    if (currentStatus === nextStatus) return true;

    const allowed = CLAIM_STATUS_FLOW[currentStatus];
    return allowed ? allowed.includes(nextStatus) : false;
};

const enforceStateMachine = (modelType) => {
    return async (req, res, next) => {
        const { id } = req.params;
        const { status: nextStatus } = req.body;

        if (!nextStatus) return next();

        try {
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();

            let record;
            if (modelType === 'claim') {
                record = await prisma.claim.findUnique({ where: { id: parseInt(id) } });
            }

            if (!record) return res.status(404).json({ error: 'Record not found' });

            if (!validateStatusTransition(record.status, nextStatus)) {
                return res.status(400).json({
                    error: `Invalid status transition from ${record.status} to ${nextStatus}`
                });
            }

            next();
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    };
};

module.exports = { enforceStateMachine, validateStatusTransition };
