/**
 * Simbi on Elide - Main Server
 *
 * Express server with Pug view rendering for Simbi
 */

import express from 'express';
import path from 'path';
import { setupViewEngine } from './lib/views';
import { HomeController } from './controllers/homeController';
import { ServicesController } from './controllers/servicesController';
import { UsersController } from './controllers/usersController';
import { TalksController } from './controllers/talksController';

const app = express();
const PORT = process.env.PORT || 3000;

// Controllers
const homeController = new HomeController();
const servicesController = new ServicesController();
const usersController = new UsersController();
const talksController = new TalksController();

// Setup view engine
const viewsPath = path.join(__dirname, '../views');
setupViewEngine(app, viewsPath);

// Static assets
app.use('/assets', express.static(path.join(__dirname, '../frontend/assets')));
app.use('/simbi.js', express.static(path.join(__dirname, '../frontend/simbi.js')));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock authentication middleware
app.use((req: any, res, next) => {
  // In production, this would check actual session/JWT
  req.user = null; // Set to user object if authenticated
  next();
});

// Routes
app.get('/', homeController.index.bind(homeController));
app.get('/services', servicesController.index.bind(servicesController));
app.get('/users/:id', usersController.showProfile.bind(usersController));
app.get('/talks', talksController.index.bind(talksController));

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).send('Internal Server Error');
});

// Start server
app.listen(PORT, () => {
  console.log(`Simbi on Elide server running on port ${PORT}`);
  console.log(`View rendering system initialized with views at: ${viewsPath}`);
});

export default app;
