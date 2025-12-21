import { Router } from 'express';
import { DatabaseController } from '../controllers/database.controller';

/**
 * Database Routes
 * 
 * Note: In NestJS, routes are typically defined using decorators in controllers.
 * This file is provided for reference and potential future Express.js migration.
 * 
 * The actual routes are defined in DatabaseController using @Controller('databases') decorator.
 * 
 * Routes:
 * - POST   /databases                    - Create database
 * - GET    /databases/:databaseUuid      - Get database
 * - PUT    /databases/:databaseUuid      - Update database
 * - DELETE /databases/:databaseUuid      - Delete database
 * - POST   /databases/:databaseUuid/rows - Create row
 * - GET    /databases/:databaseUuid/rows  - Get rows
 * - GET    /databases/:databaseUuid/rows/:rowUuid - Get row
 * - PUT    /databases/:databaseUuid/rows/:rowUuid - Update row
 * - DELETE /databases/:databaseUuid/rows/:rowUuid - Delete row
 */

const router = Router();
// In NestJS, routes are handled by decorators in DatabaseController
// If migrating to Express.js, uncomment and configure:
// const databaseController = new DatabaseController(/* dependencies */);
// router.post('/', databaseController.createDatabase.bind(databaseController));
// router.get('/:databaseUuid', databaseController.getDatabase.bind(databaseController));
// router.put('/:databaseUuid', databaseController.updateDatabase.bind(databaseController));
// router.delete('/:databaseUuid', databaseController.deleteDatabase.bind(databaseController));
// router.post('/:databaseUuid/rows', databaseController.createRow.bind(databaseController));
// router.get('/:databaseUuid/rows', databaseController.getRows.bind(databaseController));
// router.get('/:databaseUuid/rows/:rowUuid', databaseController.getRow.bind(databaseController));
// router.put('/:databaseUuid/rows/:rowUuid', databaseController.updateRow.bind(databaseController));
// router.delete('/:databaseUuid/rows/:rowUuid', databaseController.deleteRow.bind(databaseController));

export default router;

