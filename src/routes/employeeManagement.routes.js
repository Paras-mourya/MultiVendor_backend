import express from 'express';
import EmployeeController from '../controllers/employee.controller.js';
import RoleController from '../controllers/role.controller.js';
import { adminProtect } from '../middleware/adminAuth.middleware.js';
import uploadMiddleware from '../middleware/upload.middleware.js';

const router = express.Router();

/**
 * ROLE MANAGEMENT (Admin Only)
 */
router.use('/roles', adminProtect);
router.route('/roles')
  .post(RoleController.createRole)
  .get(RoleController.getAllRoles);

router.route('/roles/:id')
  .patch(RoleController.updateRole)
  .delete(RoleController.deleteRole);

/**
 * EMPLOYEE MANAGEMENT (Admin Only)
 */
router.use('/employees', adminProtect);

router.get('/employees/stats', EmployeeController.getStats);
router.get('/employees/export', EmployeeController.exportEmployees);

router.route('/employees')
  .post(
    uploadMiddleware.fields([
      { name: 'profileImage', maxCount: 1 },
      { name: 'identityFront', maxCount: 1 },
      { name: 'identityBack', maxCount: 1 }
    ]),
    EmployeeController.registerEmployee
  )
  .get(EmployeeController.getAllEmployees);

router.route('/employees/:id')
  .delete(EmployeeController.deleteEmployee);

router.patch('/employees/:id/status', EmployeeController.toggleStatus);

export default router;
