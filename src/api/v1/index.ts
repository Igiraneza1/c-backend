import express, { Router } from 'express';
// import roleRoutes from './roles/routes';
// import authRoutes from './auth/routes';
// import userRoutes from './users/routes';
// import subscriptionRoutes from './subscribers/routes';
// import postRoutes from './posts/routes';
// import commentRoutes from './comments/routes';
import chatbotRoutes from './chatbot/routes';


const router: Router = express.Router();

// router.use('/roles', roleRoutes);
// router.use('/auth', authRoutes);
// router.use('/users', userRoutes);
// router.use('/subscribers', subscriptionRoutes);
// router.use('/posts', postRoutes);
// router.use('/comments', commentRoutes);
router.use('/documents', chatbotRoutes);


export default router;
