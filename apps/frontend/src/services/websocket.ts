import { io, Socket } from 'socket.io-client'
import { ref, readonly } from 'vue'

export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

class WebSocketService {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private statusRef = ref<ConnectionStatus>(ConnectionStatus.DISCONNECTED)
  private errorRef = ref<string | null>(null)
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map()

  readonly status = readonly(this.statusRef)
  readonly error = readonly(this.errorRef)

  connect(token: string): Socket {
    if (this.socket?.connected) {
      console.log('WebSocket already connected')
      return this.socket
    }

    this.statusRef.value = ConnectionStatus.CONNECTING
    this.errorRef.value = null

    this.socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3000', {
      auth: { token },
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 10000,
      transports: ['websocket', 'polling'],
    })

    this.setupEventHandlers()
    this.reattachListeners()

    return this.socket
  }

  private setupEventHandlers() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('WebSocket connected')
      this.statusRef.value = ConnectionStatus.CONNECTED
      this.errorRef.value = null
      this.reconnectAttempts = 0
    })

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason)
      this.statusRef.value = ConnectionStatus.DISCONNECTED

      if (reason === 'io server disconnect') {
        // Server initiated disconnect, manual reconnect needed
        this.errorRef.value = 'Disconnected by server'
      }
    })

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      this.statusRef.value = ConnectionStatus.ERROR
      this.errorRef.value = error.message || 'Connection error'
    })

    this.socket.io.on('reconnect_attempt', (attemptNumber) => {
      console.log(`WebSocket reconnect attempt ${attemptNumber}`)
      this.statusRef.value = ConnectionStatus.RECONNECTING
      this.reconnectAttempts = attemptNumber
    })

    this.socket.io.on('reconnect', (attemptNumber) => {
      console.log(`WebSocket reconnected after ${attemptNumber} attempts`)
      this.statusRef.value = ConnectionStatus.CONNECTED
      this.errorRef.value = null
      this.reconnectAttempts = 0
    })

    this.socket.io.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed')
      this.statusRef.value = ConnectionStatus.ERROR
      this.errorRef.value = 'Failed to reconnect after multiple attempts'
    })

    this.socket.io.on('error', (error) => {
      console.error('WebSocket error:', error)
      this.statusRef.value = ConnectionStatus.ERROR
      this.errorRef.value = error.message || 'Socket error'
    })
  }

  private reattachListeners() {
    if (!this.socket) return

    // Reattach all stored listeners
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        this.socket!.on(event, callback)
      })
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.statusRef.value = ConnectionStatus.DISCONNECTED
      this.errorRef.value = null
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)

    this.socket?.on(event, callback)
  }

  emit(event: string, data?: any) {
    if (!this.socket?.connected) {
      console.warn('Cannot emit event, socket not connected')
      return false
    }

    this.socket.emit(event, data)
    return true
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (callback) {
      this.listeners.get(event)?.delete(callback)
      this.socket?.off(event, callback)
    } else {
      this.listeners.delete(event)
      this.socket?.off(event)
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }

  getReconnectAttempts(): number {
    return this.reconnectAttempts
  }

  getConnectionStatus(): ConnectionStatus {
    return this.statusRef.value
  }

  getError(): string | null {
    return this.errorRef.value
  }

  // Manually trigger reconnection
  reconnect(token: string) {
    this.disconnect()
    setTimeout(() => {
      this.connect(token)
    }, 100)
  }
}

export default new WebSocketService()
