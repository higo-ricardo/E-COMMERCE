import { CheckoutController } from "../controllers/checkout/CheckoutController.js"

;(async () => {
  const controller = new CheckoutController()
  await controller.init()
})()
