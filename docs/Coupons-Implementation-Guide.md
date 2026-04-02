# Guia Rápido — Sistema de Cupons (Sprint 06)

## Visão geral
- Backend Appwrite: collections `coupons` (campos code, type, value, minOrderValue, maxDiscount, expirationDate, usageLimit, timesUsed, cpf, isActive, cpfLimit) e `coupon_usage` (code, cpf, uses, lastUsedAt).
- Regras principais: cupom ativo, não expirado, respeita usageLimit e minOrderValue; restrição opcional por CPF com limite por CPF; desconto limitado a 50% do subtotal e ao teto maxDiscount; nunca deixa total negativo.
- Contadores: `timesUsed` global na `coupons`; por CPF em `coupon_usage`.

## Fluxo de criação
1) Acesse `docs/dashboard-cupons.html` (UI admin).  
2) Preencha: código (maiúsculas), tipo (percentual/fixo), valor, opcionalmente minOrderValue, maxDiscount, expirationDate, usageLimit, cpf/cpfLimit, isActive.  
3) Salve: vai para `coupons` no Appwrite; contadores começam em zero.

## Fluxo de aplicação (checkout/carrinho)
1) Usuário digita o código; front chama `CouponService.apply(code, { subtotal, cpf? })`.  
2) `validate` checa existência, ativo, expiração, limites global/CPF, mínimo do pedido.  
3) `apply` calcula desconto (percentual ou fixo), aplica maxDiscount e cap de 50%, garante subtotal ≥ 0, incrementa contadores global e por CPF.  
4) CartService armazena o cupom aplicado no localStorage; resumo mostra o desconto; pedido envia `couponCode` e `discountAmount`.

## Arquivos-chave
- `js/couponService.js`, `js/couponRepository.js`, `js/couponUsageRepository.js`
- `controllers/checkout/CheckoutController.js` (aplicação no checkout)
- `js/cartService.js` + `cart.html` (aplicação no carrinho)
- `docs/dashboard-cupons.html` + `docs/styles/dashboard-cupons.css` (UI admin)
- Testes: `tests/couponService.test.js`

## Limitações atuais
- Não há suporte a cupons por produto ou categoria (US-58/59) — requer adicionar atributos no Appwrite e ajustar `CouponService.apply` para filtrar itens do carrinho.
- Não foi executado `npm test`/`npm run test:coverage` neste ambiente por ausência de Node/npm.

## Próximos passos sugeridos
- Estender schema para `productIds`/`categories` e aplicar desconto apenas em itens elegíveis.  
- Rodar a suíte de testes após instalar Node.js/npm: `npm install`, `npm test`, `npm run test:coverage`.  
- Implementar UI no dashboard para selecionar produtos/categorias quando o schema estiver pronto.  
