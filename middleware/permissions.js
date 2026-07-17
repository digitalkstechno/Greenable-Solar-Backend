function getRolePermissions(role) {
  if (!role || !Array.isArray(role.permissions) || role.permissions.length === 0) {
    return {};
  }
  const perms = role.permissions[0];
  if (!perms) return {};
 
  return typeof perms.toObject === 'function' ? perms.toObject() : JSON.parse(JSON.stringify(perms));
}

function authorize(feature, action) {
  return (req, res, next) => {
    const user = req.user;
    if (!user || !user.role) {
      return res.status(403).json({ status: "Fail", message: "Access denied" });
    }

    
    if (user.role.roleName && user.role.roleName.toLowerCase() === 'super admin') {
      return next();
    }

    const perms = getRolePermissions(user.role);
    const featurePerms = perms[feature];

  
    if (featurePerms && featurePerms[action] == true) {
      return next();
    }

    return res.status(403).json({ status: "Fail", message: "Access denied" });
  };
}

function leadReadScope() {
  return (req, res, next) => {
    const user = req.user;
    if (!user || !user.role) {
      return res.status(403).json({
        status: "Fail",
        message: "Access denied",
      });
    }

 
    if (user.role.roleName && user.role.roleName.toLowerCase() === 'super admin') {
      req.leadScope = "all";
      return next();
    }

    const perms = getRolePermissions(user.role);
    const leadPerms = perms.lead || {};

    if (leadPerms.readAll) {
      req.leadScope = "all";
      return next();
    }

    if (leadPerms.readOwn) {
      req.leadScope = "own";
      return next();
    }

    return res.status(403).json({
      status: "Fail",
      message: "Access denied",
    });
  };
}

function dashboardReadScope() {
  return (req, res, next) => {
    const user = req.user;
    if (!user || !user.role) {
      return res.status(403).json({
        status: "Fail",
        message: "Access denied",
      });
    }

    const perms = getRolePermissions(user.role);
    const dashboardPerms = perms.dashboard || {};

    if (dashboardPerms.readAll) {
      return next();
    }

    return res.status(403).json({
      status: "Fail",
      message: "Access denied",
    });
  };
}

module.exports = {
  authorize,
  leadReadScope,
  dashboardReadScope,
};

