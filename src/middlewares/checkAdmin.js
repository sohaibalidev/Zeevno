const { checkAuth } = require('./checkAuth');

exports.isAdmin = async (req, res, next) => {
    try {
        const isAuth = await checkAuth(req, res);
        if (!isAuth) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        const { user } = req
        if (!user) {
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }

        if (!Array.isArray(user.roles)) {
            return res.status(403).json({
                success: false,
                error: 'Access Denied'
            });
        }

        if (!user.roles.includes('admin')) {
            return res.status(403).json({
                success: false,
                error: 'Admin privileges required'
            });
        }

        req.isAdmin = true;

        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
