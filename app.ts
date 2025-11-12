import { createServer } from 'node:http';
import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import { initializeDatabase } from './backend/db';
import { setupViewEngine } from './backend/lib/views';
import { registerHelpers } from './backend/lib/helpers';

// Controllers
import { HomeController } from './backend/controllers/homeController';
import { ServicesController } from './backend/controllers/servicesController';
import { UsersController } from './backend/controllers/usersController';
import { TalksController } from './backend/controllers/talksController';

// API Controllers
import { TalksController as ApiTalksController } from './backend/controllers/talks.controller';
import { UsersController as ApiUsersController } from './backend/controllers/users.controller';
import { ServicesController as ApiServicesController } from './backend/controllers/services.controller';

// Worker system
import { initializeWorkers } from './workers';

// Environment
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize Express app
const app: Express = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (Vue bundles, assets)
app.use('/assets', express.static(path.join(__dirname, 'frontend/dist')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// CORS for API
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Setup view engine (Pug templates)
const viewsPath = path.join(__dirname, 'views');
setupViewEngine(app, viewsPath);
registerHelpers();

// ==================== CONTROLLERS ====================

// Initialize controllers
const homeController = new HomeController();
const servicesController = new ServicesController();
const usersController = new UsersController();
const talksController = new TalksController();

// API controllers
const apiTalksController = new ApiTalksController();
const apiUsersController = new ApiUsersController();
const apiServicesController = new ApiServicesController();

// ==================== WEB ROUTES (View Rendering) ====================

// Home
app.get('/', homeController.index.bind(homeController));
app.get('/home', homeController.index.bind(homeController));

// Services
app.get('/services', servicesController.index.bind(servicesController));
app.get('/services/newest', servicesController.newest.bind(servicesController));
app.get('/services/virtual', servicesController.virtual.bind(servicesController));
app.get('/services/local', servicesController.local.bind(servicesController));
app.get('/services/search', servicesController.search.bind(servicesController));

// Users
app.get('/users/:id', usersController.showProfile.bind(usersController));
app.get('/dashboard', usersController.dashboard.bind(usersController));
app.get('/settings', usersController.settings.bind(usersController));

// Talks/Inbox
app.get('/inbox', talksController.index.bind(talksController));
app.get('/inbox/:id', talksController.show.bind(talksController));

// ==================== API ROUTES (JSON) ====================

// API v1 - Talks
app.get('/api/v1/talks', apiTalksController.index.bind(apiTalksController));
app.get('/api/v1/talks/:id', apiTalksController.show.bind(apiTalksController));
app.post('/api/v1/talks', apiTalksController.create.bind(apiTalksController));
app.get('/api/v1/talks/proposal', apiTalksController.proposal.bind(apiTalksController));
app.post('/api/v1/talks/inbound', apiTalksController.inbound.bind(apiTalksController));

// Talk actions
app.post('/api/v1/talks/:id/message', apiTalksController.message.bind(apiTalksController));
app.post('/api/v1/talks/:id/offer', apiTalksController.offer.bind(apiTalksController));
app.post('/api/v1/talks/:id/accept', apiTalksController.accept.bind(apiTalksController));
app.post('/api/v1/talks/:id/close', apiTalksController.close.bind(apiTalksController));
app.post('/api/v1/talks/:id/confirm', apiTalksController.confirm.bind(apiTalksController));
app.post('/api/v1/talks/:id/cancel', apiTalksController.cancel.bind(apiTalksController));
app.post('/api/v1/talks/:id/review', apiTalksController.review.bind(apiTalksController));
app.post('/api/v1/talks/:id/update_review', apiTalksController.updateReview.bind(apiTalksController));
app.post('/api/v1/talks/:id/rate', apiTalksController.rate.bind(apiTalksController));
app.post('/api/v1/talks/:id/order', apiTalksController.order.bind(apiTalksController));
app.post('/api/v1/talks/:id/accept_order', apiTalksController.acceptOrder.bind(apiTalksController));
app.post('/api/v1/talks/:id/cancel_order', apiTalksController.cancelOrder.bind(apiTalksController));
app.post('/api/v1/talks/:id/confirm_delivery', apiTalksController.confirmDelivery.bind(apiTalksController));
app.post('/api/v1/talks/:id/share', apiTalksController.share.bind(apiTalksController));
app.post('/api/v1/talks/:id/on_hold', apiTalksController.onHold.bind(apiTalksController));
app.post('/api/v1/talks/:id/off_hold', apiTalksController.offHold.bind(apiTalksController));
app.post('/api/v1/talks/:id/dismiss-feedback', apiTalksController.dismissFeedback.bind(apiTalksController));
app.post('/api/v1/talks/:id/read', apiTalksController.read.bind(apiTalksController));
app.post('/api/v1/talks/archive', apiTalksController.archive.bind(apiTalksController));
app.post('/api/v1/talks/unarchive', apiTalksController.unarchive.bind(apiTalksController));
app.post('/api/v1/talks/read', apiTalksController.batchRead.bind(apiTalksController));
app.post('/api/v1/talks/unread', apiTalksController.unread.bind(apiTalksController));

// API v1 - Users
app.get('/api/v1/users/me', apiUsersController.me.bind(apiUsersController));
app.get('/api/v1/users/preauth', apiUsersController.preauth.bind(apiUsersController));
app.post('/api/v1/users/auth', apiUsersController.auth.bind(apiUsersController));
app.delete('/api/v1/users/logout', apiUsersController.logout.bind(apiUsersController));
app.post('/api/v1/users/device', apiUsersController.device.bind(apiUsersController));
app.post('/api/v1/users/settings', apiUsersController.settings.bind(apiUsersController));
app.get('/api/v1/users/feed', apiUsersController.feed.bind(apiUsersController));
app.post('/api/v1/users/stripe_account', apiUsersController.stripeAccount.bind(apiUsersController));
app.post('/api/v1/users/customer', apiUsersController.customer.bind(apiUsersController));
app.get('/api/v1/users/search', apiUsersController.search.bind(apiUsersController));
app.post('/api/v1/users/add_share_bonus', apiUsersController.addShareBonus.bind(apiUsersController));
app.post('/api/v1/users/add_fb_like_bonus', apiUsersController.addFbLikeBonus.bind(apiUsersController));
app.post('/api/v1/users/add_fb_shared_referral_bonus', apiUsersController.addFbSharedReferralBonus.bind(apiUsersController));
app.post('/api/v1/users/create_subscription', apiUsersController.createSubscription.bind(apiUsersController));
app.post('/api/v1/users/reactivate_subscription', apiUsersController.reactivateSubscription.bind(apiUsersController));
app.delete('/api/v1/users/cancel_subscription', apiUsersController.cancelSubscription.bind(apiUsersController));
app.post('/api/v1/users/vacation_mode', apiUsersController.vacationMode.bind(apiUsersController));
app.post('/api/v1/users/email_event', apiUsersController.emailEvent.bind(apiUsersController));
app.get('/api/v1/users/:id', apiUsersController.show.bind(apiUsersController));

// API v1 - Services
app.get('/api/v1/services/match', apiServicesController.match.bind(apiServicesController));
app.get('/api/v1/services/favorites', apiServicesController.favorites.bind(apiServicesController));
app.get('/api/v1/services/admirers', apiServicesController.admirers.bind(apiServicesController));
app.get('/api/v1/services/search', apiServicesController.search.bind(apiServicesController));
app.get('/api/v1/services/:id', apiServicesController.show.bind(apiServicesController));
app.get('/api/v1/services/:id/proposal', apiServicesController.proposal.bind(apiServicesController));
app.post('/api/v1/services/:id/like', apiServicesController.like.bind(apiServicesController));
app.post('/api/v1/services/:id/unlike', apiServicesController.unlike.bind(apiServicesController));
app.post('/api/v1/services/:id/superlike', apiServicesController.superlike.bind(apiServicesController));
app.post('/api/v1/services/:id/undo', apiServicesController.undo.bind(apiServicesController));
app.post('/api/v1/services/:id/favor', apiServicesController.favor.bind(apiServicesController));
app.post('/api/v1/services/:id/compliment', apiServicesController.compliment.bind(apiServicesController));
app.put('/api/v1/services/:id', apiServicesController.update.bind(apiServicesController));
app.delete('/api/v1/services/:id', apiServicesController.destroy.bind(apiServicesController));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    elide: true,
    polyglot: true,
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).render('errors/404', { url: req.url });
});

// ==================== SERVER STARTUP ====================

async function startServer() {
  console.log('🚀 Starting Simbi on Elide polyglot runtime...');
  console.log(`📦 Environment: ${NODE_ENV}`);

  try {
    // Initialize database
    console.log('📊 Connecting to PostgreSQL...');
    await initializeDatabase({ runMigrations: false });
    console.log('✅ Database connected');

    // Initialize workers
    console.log('⚙️  Initializing polyglot worker system...');
    await initializeWorkers();
    console.log('✅ Workers initialized');

    // Create HTTP server using Node.js native http (Elide beta11-rc1 support)
    const server = createServer(app);

    server.listen(PORT, () => {
      console.log('');
      console.log('✨ Simbi on Elide is running!');
      console.log('');
      console.log(`🌐 Web:     http://localhost:${PORT}`);
      console.log(`🔌 API:     http://localhost:${PORT}/api/v1`);
      console.log(`💚 Health:  http://localhost:${PORT}/health`);
      console.log('');
      console.log('🎉 Ready to accept requests');
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n🛑 Shutting down gracefully...');
      server.close(async () => {
        console.log('✅ HTTP server closed');
        // Close database connections, worker queues, etc.
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export { app };
