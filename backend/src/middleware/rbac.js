const prisma = require('../db');

/**
 * Middleware to check if the current user has one of the required roles.
 * Must be used after getAdmin or getCurrentUser middleware.
 */
function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ detail: "Unauthorized" });
        }
        
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ detail: "Forbidden: Insufficient permissions" });
        }
        
        next();
    };
}

/**
 * Audit Log Service
 */
async function logAdminAction(admin, action, entity_type, entity_id, details = {}) {
    try {
        await prisma.adminActionLog.create({
            data: {
                admin_id: admin?.id || 'system',
                admin_name: admin?.name || admin?.email || 'Admin',
                action: String(action),
                entity_type: String(entity_type),
                entity_id: String(entity_id || ''),
                details: details || {}
            }
        });
    } catch (e) {
        console.error("Failed to log admin action:", e);
    }
}

module.exports = {
    requireRole,
    logAdminAction
};
