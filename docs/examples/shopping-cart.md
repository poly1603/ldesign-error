# 购物车示例

本示例展示了如何使用 @ldesign/store 构建一个功能完整的购物车系统，包括商品管理、价格计算、优惠券、持久化等功能。

## Store 定义

```typescript
import { Action, AsyncAction, BaseStore, Debounce, Getter, State, Store, createStoreClass } from '@ldesign/store'

// 类型定义
interface Product {
  id: number
  name: string
  description: string
  price: number
  originalPrice?: number
  image: string
  category: string
  stock: number
  rating: number
  tags: string[]
}

interface CartItem {
  id: number
  productId: number
  product: Product
  quantity: number
  selectedVariant?: {
    size?: string
    color?: string
    [key: string]: any
  }
  addedAt: Date
}

interface Coupon {
  code: string
  type: 'percentage' | 'fixed' | 'shipping'
  value: number
  minAmount?: number
  maxDiscount?: number
  expiresAt: Date
  usageLimit?: number
  usedCount: number
}

interface ShippingOption {
  id: string
  name: string
  price: number
  estimatedDays: number
  description: string
}

@Store({
  id: 'shopping-cart',
  persist: {
    key: 'cart-data',
    paths: ['items', 'appliedCoupon', 'selectedShipping', 'guestInfo']
  }
})
class ShoppingCartStore extends BaseStore {
  // 购物车商品
  @State({ default: [] })
  items!: CartItem[]

  // 优惠券
  @State({ default: null })
  appliedCoupon!: Coupon | null

  @State({ default: [] })
  availableCoupons!: Coupon[]

  // 配送选项
  @State({ default: null })
  selectedShipping!: ShippingOption | null

  @State({ default: [] })
  shippingOptions!: ShippingOption[]

  // 结算状态
  @State({ default: false })
  isCheckingOut!: boolean

  @State({ default: null })
  checkoutError!: string | null

  // 访客信息（未登录用户）
  @State({
    default: {
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      }
    }
  })
  guestInfo!: {
    email: string
    phone: string
    address: {
      street: string
      city: string
      state: string
      zipCode: string
      country: string
    }
  }

  // 商品管理
  @Action()
  addItem(product: Product, quantity = 1, variant?: any) {
    const existingItem = this.items.find(item =>
      item.productId === product.id
      && JSON.stringify(item.selectedVariant) === JSON.stringify(variant)
    )

    if (existingItem) {
      this.updateQuantity(existingItem.id, existingItem.quantity + quantity)
    }
 else {
      const newItem: CartItem = {
        id: Date.now() + Math.random(),
        productId: product.id,
        product,
        quantity,
        selectedVariant: variant,
        addedAt: new Date()
      }
      this.items.push(newItem)
    }

    // 检查库存
    this.validateStock()
  }

  @Action()
  removeItem(itemId: number) {
    const index = this.items.findIndex(item => item.id === itemId)
    if (index > -1) {
      this.items.splice(index, 1)
    }
  }

  @Action()
  updateQuantity(itemId: number, quantity: number) {
    const item = this.items.find(item => item.id === itemId)
    if (item) {
      if (quantity <= 0) {
        this.removeItem(itemId)
      }
 else {
        item.quantity = Math.min(quantity, item.product.stock)
      }
    }
    this.validateStock()
  }

  @Action()
  clearCart() {
    this.items = []
    this.appliedCoupon = null
    this.selectedShipping = null
    this.checkoutError = null
  }

  @Action()
  validateStock() {
    this.items.forEach((item) => {
      if (item.quantity > item.product.stock) {
        item.quantity = item.product.stock
      }
    })
  }

  // 优惠券管理
  @AsyncAction()
  async applyCoupon(couponCode: string) {
    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode,
          cartTotal: this.subtotal,
          items: this.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price
          }))
        })
      })

      if (!response.ok) {
        throw new Error('优惠券无效或已过期')
      }

      const coupon = await response.json()
      this.appliedCoupon = coupon
      return coupon
    }
 catch (error) {
      this.appliedCoupon = null
      throw error
    }
  }

  @Action()
  removeCoupon() {
    this.appliedCoupon = null
  }

  @AsyncAction()
  async fetchAvailableCoupons() {
    const response = await fetch('/api/coupons/available')
    const coupons = await response.json()
    this.availableCoupons = coupons
    return coupons
  }

  // 配送选项
  @AsyncAction()
  async fetchShippingOptions() {
    const response = await fetch('/api/shipping/options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: this.items,
        address: this.guestInfo.address
      })
    })

    const options = await response.json()
    this.shippingOptions = options

    // 自动选择第一个选项
    if (options.length > 0 && !this.selectedShipping) {
      this.selectedShipping = options[0]
    }

    return options
  }

  @Action()
  selectShipping(option: ShippingOption) {
    this.selectedShipping = option
  }

  // 访客信息
  @Action()
  updateGuestInfo(info: Partial<typeof this.guestInfo>) {
    this.guestInfo = {
      ...this.guestInfo,
      ...info
    }
  }

  @Action()
  updateGuestAddress(address: Partial<typeof this.guestInfo.address>) {
    this.guestInfo.address = {
      ...this.guestInfo.address,
      ...address
    }
  }

  // 结算
  @AsyncAction()
  async checkout(paymentMethod: string) {
    try {
      this.checkoutError = null

      // 验证购物车
      if (this.items.length === 0) {
        throw new Error('购物车为空')
      }

      if (!this.selectedShipping) {
        throw new Error('请选择配送方式')
      }

      // 最终验证库存
      await this.validateCartStock()

      const orderData = {
        items: this.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          variant: item.selectedVariant,
          price: item.product.price
        })),
        coupon: this.appliedCoupon,
        shipping: this.selectedShipping,
        guestInfo: this.guestInfo,
        paymentMethod,
        totals: {
          subtotal: this.subtotal,
          discount: this.discountAmount,
          shipping: this.shippingCost,
          tax: this.taxAmount,
          total: this.total
        }
      }

      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '结算失败')
      }

      const order = await response.json()

      // 清空购物车
      this.clearCart()

      return order
    }
 catch (error) {
      this.checkoutError = error.message
      throw error
    }
  }

  @AsyncAction()
  async validateCartStock() {
    const productIds = this.items.map(item => item.productId)
    const response = await fetch('/api/products/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productIds })
    })

    const stockData = await response.json()

    // 更新库存信息
    this.items.forEach((item) => {
      const stock = stockData[item.productId]
      if (stock !== undefined) {
        item.product.stock = stock
        if (item.quantity > stock) {
          item.quantity = stock
        }
      }
    })

    // 移除缺货商品
    this.items = this.items.filter(item => item.product.stock > 0)
  }

  // 保存购物车（防抖）
  @Debounce(1000)
  @AsyncAction()
  async saveCart() {
    try {
      await fetch('/api/cart/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: this.items,
          appliedCoupon: this.appliedCoupon,
          selectedShipping: this.selectedShipping
        })
      })
    }
 catch (error) {
      console.warn('保存购物车失败:', error)
    }
  }

  // 计算属性
  @Getter()
  get itemCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0)
  }

  @Getter()
  get subtotal() {
    return this.items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity)
    }, 0)
  }

  @Getter()
  get discountAmount() {
    if (!this.appliedCoupon)
return 0

    const { type, value, maxDiscount } = this.appliedCoupon

    switch (type) {
      case 'percentage':
        const percentageDiscount = this.subtotal * (value / 100)
        return maxDiscount ? Math.min(percentageDiscount, maxDiscount) : percentageDiscount

      case 'fixed':
        return Math.min(value, this.subtotal)

      case 'shipping':
        return this.shippingCost

      default:
        return 0
    }
  }

  @Getter()
  get shippingCost() {
    return this.selectedShipping?.price || 0
  }

  @Getter()
  get taxAmount() {
    const taxRate = 0.08 // 8% 税率
    return (this.subtotal - this.discountAmount) * taxRate
  }

  @Getter()
  get total() {
    const shippingCost = this.appliedCoupon?.type === 'shipping' ? 0 : this.shippingCost
    return this.subtotal - this.discountAmount + shippingCost + this.taxAmount
  }

  @Getter()
  get isEmpty() {
    return this.items.length === 0
  }

  @Getter()
  get hasOutOfStockItems() {
    return this.items.some(item => item.quantity > item.product.stock)
  }

  @Getter()
  get canCheckout() {
    return !this.isEmpty
      && !this.hasOutOfStockItems
      && !this.isCheckingOut
      && this.selectedShipping !== null
  }

  @Getter()
  get cartSummary() {
    return {
      itemCount: this.itemCount,
      subtotal: this.subtotal,
      discount: this.discountAmount,
      shipping: this.shippingCost,
      tax: this.taxAmount,
      total: this.total
    }
  }

  @Getter()
  get recommendedProducts() {
    // 基于购物车商品推荐相关产品
    const categories = [...new Set(this.items.map(item => item.product.category))]
    const tags = [...new Set(this.items.flatMap(item => item.product.tags))]

    return {
      categories,
      tags,
      // 这里可以调用推荐算法 API
    }
  }

  @Getter()
  get estimatedDelivery() {
    if (!this.selectedShipping)
return null

    const today = new Date()
    const deliveryDate = new Date(today)
    deliveryDate.setDate(today.getDate() + this.selectedShipping.estimatedDays)

    return deliveryDate
  }
}

export const useShoppingCartStore = createStoreClass(ShoppingCartStore)
```

## Vue 组件使用

### 购物车组件

```vue
<template>
  <div class="shopping-cart">
    <div class="cart-header">
      <h2>购物车 ({{ cartStore.itemCount }})</h2>
      <button v-if="!cartStore.isEmpty" @click="cartStore.clearCart()" class="clear-btn">
        清空购物车
      </button>
    </div>

    <!-- 空购物车状态 -->
    <div v-if="cartStore.isEmpty" class="empty-cart">
      <div class="empty-icon">🛒</div>
      <h3>购物车是空的</h3>
      <p>快去挑选一些商品吧！</p>
      <router-link to="/products" class="shop-btn">去购物</router-link>
    </div>

    <!-- 购物车商品列表 -->
    <div v-else class="cart-content">
      <div class="cart-items">
        <div
          v-for="item in cartStore.items"
          :key="item.id"
          class="cart-item"
          :class="{ 'out-of-stock': item.quantity > item.product.stock }"
        >
          <div class="item-image">
            <img :src="item.product.image" :alt="item.product.name">
          </div>

          <div class="item-details">
            <h4>{{ item.product.name }}</h4>
            <p class="item-description">{{ item.product.description }}</p>

            <!-- 商品变体 -->
            <div v-if="item.selectedVariant" class="item-variant">
              <span v-for="(value, key) in item.selectedVariant" :key="key">
                {{ key }}: {{ value }}
              </span>
            </div>

            <!-- 库存警告 -->
            <div v-if="item.quantity > item.product.stock" class="stock-warning">
              ⚠️ 库存不足，仅剩 {{ item.product.stock }} 件
            </div>
          </div>

          <div class="item-price">
            <span class="current-price">¥{{ item.product.price }}</span>
            <span v-if="item.product.originalPrice" class="original-price">
              ¥{{ item.product.originalPrice }}
            </span>
          </div>

          <div class="item-quantity">
            <button
              @click="cartStore.updateQuantity(item.id, item.quantity - 1)"
              :disabled="item.quantity <= 1"
            >
              -
            </button>
            <input
              :value="item.quantity"
              @input="updateQuantity(item.id, $event.target.value)"
              type="number"
              min="1"
              :max="item.product.stock"
            >
            <button
              @click="cartStore.updateQuantity(item.id, item.quantity + 1)"
              :disabled="item.quantity >= item.product.stock"
            >
              +
            </button>
          </div>

          <div class="item-total">
            ¥{{ (item.product.price * item.quantity).toFixed(2) }}
          </div>

          <button @click="cartStore.removeItem(item.id)" class="remove-btn">
            ×
          </button>
        </div>
      </div>

      <!-- 优惠券 -->
      <div class="coupon-section">
        <h3>优惠券</h3>
        <div class="coupon-input">
          <input
            v-model="couponCode"
            placeholder="输入优惠券代码"
            :disabled="cartStore.$isLoading('applyCoupon')"
          >
          <button
            @click="applyCoupon"
            :disabled="!couponCode || cartStore.$isLoading('applyCoupon')"
          >
            <span v-if="cartStore.$isLoading('applyCoupon')">验证中...</span>
            <span v-else>应用</span>
          </button>
        </div>

        <div v-if="cartStore.appliedCoupon" class="applied-coupon">
          <span>已应用: {{ cartStore.appliedCoupon.code }}</span>
          <span class="discount">-¥{{ cartStore.discountAmount.toFixed(2) }}</span>
          <button @click="cartStore.removeCoupon()">移除</button>
        </div>

        <div v-if="couponError" class="error-message">
          {{ couponError }}
        </div>
      </div>

      <!-- 配送选项 -->
      <div class="shipping-section">
        <h3>配送方式</h3>
        <div v-if="cartStore.shippingOptions.length > 0" class="shipping-options">
          <label
            v-for="option in cartStore.shippingOptions"
            :key="option.id"
            class="shipping-option"
          >
            <input
              type="radio"
              :value="option"
              :checked="cartStore.selectedShipping?.id === option.id"
              @change="cartStore.selectShipping(option)"
            >
            <div class="option-details">
              <span class="option-name">{{ option.name }}</span>
              <span class="option-price">¥{{ option.price }}</span>
              <span class="option-time">{{ option.estimatedDays }} 天送达</span>
              <p class="option-description">{{ option.description }}</p>
            </div>
          </label>
        </div>
        <button
          v-else
          @click="cartStore.fetchShippingOptions()"
          :disabled="cartStore.$isLoading('fetchShippingOptions')"
        >
          获取配送选项
        </button>
      </div>

      <!-- 价格汇总 -->
      <div class="cart-summary">
        <h3>订单汇总</h3>
        <div class="summary-line">
          <span>商品小计 ({{ cartStore.itemCount }} 件)</span>
          <span>¥{{ cartStore.subtotal.toFixed(2) }}</span>
        </div>

        <div v-if="cartStore.discountAmount > 0" class="summary-line discount">
          <span>优惠折扣</span>
          <span>-¥{{ cartStore.discountAmount.toFixed(2) }}</span>
        </div>

        <div class="summary-line">
          <span>配送费用</span>
          <span>
            <span v-if="cartStore.appliedCoupon?.type === 'shipping'">
              <s>¥{{ cartStore.shippingCost.toFixed(2) }}</s> 免费
            </span>
            <span v-else>¥{{ cartStore.shippingCost.toFixed(2) }}</span>
          </span>
        </div>

        <div class="summary-line">
          <span>税费</span>
          <span>¥{{ cartStore.taxAmount.toFixed(2) }}</span>
        </div>

        <div class="summary-line total">
          <span>总计</span>
          <span>¥{{ cartStore.total.toFixed(2) }}</span>
        </div>

        <div v-if="cartStore.estimatedDelivery" class="delivery-info">
          预计送达：{{ formatDate(cartStore.estimatedDelivery) }}
        </div>

        <button
          @click="proceedToCheckout"
          :disabled="!cartStore.canCheckout"
          class="checkout-btn"
        >
          <span v-if="cartStore.isCheckingOut">处理中...</span>
          <span v-else>去结算</span>
        </button>

        <div v-if="cartStore.checkoutError" class="error-message">
          {{ cartStore.checkoutError }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useShoppingCartStore } from '../stores/shopping-cart'

const router = useRouter()
const cartStore = useShoppingCartStore()

const couponCode = ref('')
const couponError = ref('')

function updateQuantity(itemId: number, value: string) {
  const quantity = parseInt(value) || 1
  cartStore.updateQuantity(itemId, quantity)
}

async function applyCoupon() {
  try {
    couponError.value = ''
    await cartStore.applyCoupon(couponCode.value)
    couponCode.value = ''
  } catch (error) {
    couponError.value = error.message
  }
}

function proceedToCheckout() {
  router.push('/checkout')
}

function formatDate(date: Date) {
  return date.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
}

// 自动保存购物车
watch(() => cartStore.items, () => {
  cartStore.saveCart()
}, { deep: true })
</script>

<style scoped>
.shopping-cart {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.empty-cart {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.cart-content {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 30px;
}

.cart-item {
  display: grid;
  grid-template-columns: 80px 1fr auto auto auto auto;
  gap: 15px;
  align-items: center;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 10px;
}

.cart-item.out-of-stock {
  background-color: #fff5f5;
  border-color: #fed7d7;
}

.item-image img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
}

.item-details h4 {
  margin: 0 0 5px 0;
  font-size: 16px;
}

.item-description {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.item-variant {
  font-size: 12px;
  color: #888;
  margin-top: 5px;
}

.stock-warning {
  color: #e53e3e;
  font-size: 12px;
  margin-top: 5px;
}

.item-quantity {
  display: flex;
  align-items: center;
  gap: 5px;
}

.item-quantity button {
  width: 30px;
  height: 30px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
}

.item-quantity input {
  width: 50px;
  text-align: center;
  border: 1px solid #ddd;
  padding: 5px;
}

.current-price {
  font-weight: bold;
  color: #e53e3e;
}

.original-price {
  text-decoration: line-through;
  color: #999;
  margin-left: 5px;
}

.remove-btn {
  background: none;
  border: none;
  color: #e53e3e;
  font-size: 20px;
  cursor: pointer;
  padding: 5px;
}

.coupon-section,
.shipping-section,
.cart-summary {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.coupon-input {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.coupon-input input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.applied-coupon {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #e6fffa;
  padding: 10px;
  border-radius: 4px;
}

.discount {
  color: #38a169;
  font-weight: bold;
}

.shipping-option {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 10px;
  cursor: pointer;
}

.shipping-option:hover {
  background: #f5f5f5;
}

.option-details {
  flex: 1;
}

.option-name {
  font-weight: bold;
}

.option-price {
  color: #e53e3e;
  margin-left: 10px;
}

.option-time {
  color: #666;
  font-size: 14px;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.summary-line.total {
  font-size: 18px;
  font-weight: bold;
  border-top: 1px solid #ddd;
  padding-top: 10px;
  margin-top: 10px;
}

.checkout-btn {
  width: 100%;
  padding: 15px;
  background: #3182ce;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 20px;
}

.checkout-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-message {
  color: #e53e3e;
  font-size: 14px;
  margin-top: 10px;
}

.delivery-info {
  color: #666;
  font-size: 14px;
  margin: 10px 0;
}

@media (max-width: 768px) {
  .cart-content {
    grid-template-columns: 1fr;
  }

  .cart-item {
    grid-template-columns: 60px 1fr auto;
    gap: 10px;
  }
}
</style>
```

这个购物车示例展示了：

1. **完整的购物车功能** - 添加、删除、修改商品
2. **库存管理** - 实时库存检查和验证
3. **优惠券系统** - 多种类型的优惠券支持
4. **配送选项** - 动态获取和选择配送方式
5. **价格计算** - 复杂的价格计算逻辑
6. **状态持久化** - 购物车数据的持久化存储
7. **性能优化** - 防抖保存、批量更新等
8. **用户体验** - 完善的加载状态和错误处理
9. **响应式设计** - 移动端适配
