import { Router } from 'express';
import { CommentController } from '../controllers/comment.controller';

/**
 * Comment Routes
 * 
 * Note: In NestJS, routes are typically defined using decorators in controllers.
 * This file is provided for reference and potential future Express.js migration.
 * 
 * The actual routes are defined in CommentController using @Controller('pages/:pageUuid/comments') decorator.
 * 
 * Routes:
 * - POST   /pages/:pageUuid/comments                    - Create comment
 * - GET    /pages/:pageUuid/comments                    - Get comments
 * - GET    /pages/:pageUuid/comments/:commentUuid      - Get comment
 * - PUT    /pages/:pageUuid/comments/:commentUuid      - Update comment
 * - DELETE /pages/:pageUuid/comments/:commentUuid       - Delete comment
 * - POST   /pages/:pageUuid/comments/:commentUuid/resolve - Resolve comment
 */

const router = Router();
// In NestJS, routes are handled by decorators in CommentController
// If migrating to Express.js, uncomment and configure:
// const commentController = new CommentController(/* dependencies */);
// router.post('/', commentController.createComment.bind(commentController));
// router.get('/', commentController.getComments.bind(commentController));
// router.get('/:commentUuid', commentController.getComment.bind(commentController));
// router.put('/:commentUuid', commentController.updateComment.bind(commentController));
// router.delete('/:commentUuid', commentController.deleteComment.bind(commentController));
// router.post('/:commentUuid/resolve', commentController.resolveComment.bind(commentController));

export default router;

