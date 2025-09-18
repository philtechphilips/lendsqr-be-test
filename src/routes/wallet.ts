import { Router, Request, Response } from "express";
import { WalletController } from "../modules/wallets/wallet.controller";
import {
  validateFundWallet,
  validateTransferFunds,
  validateWithdrawFunds,
} from "../validators/wallet-validator";
import { authMiddleware } from "../middlewares/auth";

const router = Router();
const walletController = new WalletController();

// Get wallet balance
router.get("/", authMiddleware, (req: Request, res: Response) =>
  walletController.getBalance(req, res),
);

// Fund wallet
router.post(
  "/fund",
  authMiddleware,
  validateFundWallet,
  (req: Request, res: Response) => walletController.fundWallet(req, res),
);

// Transfer funds to another user
router.post(
  "/transfer",
  authMiddleware,
  validateTransferFunds,
  (req: Request, res: Response) => walletController.transferFunds(req, res),
);

// Withdraw funds from wallet
router.post(
  "/withdraw",
  authMiddleware,
  validateWithdrawFunds,
  (req: Request, res: Response) => walletController.withdrawFunds(req, res),
);

export default router;
