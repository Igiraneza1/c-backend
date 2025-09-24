import { Request, Response } from 'express';
import { RoleService } from './service';

export class RoleController {
  public async createRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const roleService = new RoleService(req.body, id, res);
<<<<<<< HEAD
<<<<<<< HEAD
      roleService.create();
=======
      roleService.createRole();
>>>>>>> 833906b (Initial MenyaLo backend setup:)
=======
      roleService.createRole();
>>>>>>> cb2d068b796c5b8f0f3685957322117daa71783b
    } catch (error) {
      throw error as Error;
    }
  }

  public async getAllRoles(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const roleService = new RoleService(req.body, id, res);
<<<<<<< HEAD
<<<<<<< HEAD
      roleService.findAll();
=======
      roleService.getAllRoles();
>>>>>>> 833906b (Initial MenyaLo backend setup:)
=======
      roleService.getAllRoles();
>>>>>>> cb2d068b796c5b8f0f3685957322117daa71783b
    } catch (error) {
      throw error as Error;
    }
  }

  public async getASingleRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const roleService = new RoleService(req.body, id, res);
<<<<<<< HEAD
<<<<<<< HEAD
      roleService.findOne();
=======
      roleService.getASingleRole();
>>>>>>> 833906b (Initial MenyaLo backend setup:)
=======
      roleService.getASingleRole();
>>>>>>> cb2d068b796c5b8f0f3685957322117daa71783b
    } catch (error) {
      throw error as Error;
    }
  }

  public async updateRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const roleService = new RoleService(req.body, id, res);
<<<<<<< HEAD
<<<<<<< HEAD
      roleService.update();
=======
      roleService.updateRole();
>>>>>>> 833906b (Initial MenyaLo backend setup:)
=======
      roleService.updateRole();
>>>>>>> cb2d068b796c5b8f0f3685957322117daa71783b
    } catch (error) {
      throw error as Error;
    }
  }

  public async deleteRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const roleService = new RoleService(req.body, id, res);
<<<<<<< HEAD
<<<<<<< HEAD
      roleService.delete();
=======
      roleService.deleteRole();
>>>>>>> 833906b (Initial MenyaLo backend setup:)
=======
      roleService.deleteRole();
>>>>>>> cb2d068b796c5b8f0f3685957322117daa71783b
    } catch (error) {
      throw error as Error;
    }
  }
}
