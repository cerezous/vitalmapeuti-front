import UIKit
import LocalAuthentication

class BiometricManager: NSObject {
    static let shared = BiometricManager()
    
    private var backgroundTime: Date?
    private let lockThreshold: TimeInterval = 15 * 60 // 15 minutos en segundos
    private var isLocked = false
    private var lockViewController: UIViewController?
    
    private override init() {
        super.init()
        setupNotifications()
    }
    
    private func setupNotifications() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appDidEnterBackground),
            name: UIApplication.didEnterBackgroundNotification,
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appWillEnterForeground),
            name: UIApplication.willEnterForegroundNotification,
            object: nil
        )
    }
    
    @objc private func appDidEnterBackground() {
        backgroundTime = Date()
        print("🔒 App entró en background - registrando timestamp")
    }
    
    @objc private func appWillEnterForeground() {
        guard let backgroundTime = backgroundTime else { return }
        
        let timeInBackground = Date().timeIntervalSince(backgroundTime)
        print("🔓 App volvió al foreground - tiempo en background: \(Int(timeInBackground)) segundos")
        
        if timeInBackground >= lockThreshold {
            print("⏰ Han pasado \(Int(timeInBackground/60)) minutos - solicitando biometría")
            requestBiometricAuthentication()
        } else {
            print("✅ Menos de 15 minutos - no se requiere biometría")
        }
    }
    
    private func requestBiometricAuthentication() {
        let context = LAContext()
        var error: NSError?
        
        // Verificar si la biometría está disponible
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            print("❌ Biometría no disponible: \(error?.localizedDescription ?? "Error desconocido")")
            showFallbackAuthentication()
            return
        }
        
        let reason = "Usamos Face ID para proteger el acceso a su información de salud."
        
        context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: reason) { [weak self] success, error in
            DispatchQueue.main.async {
                if success {
                    print("✅ Biometría exitosa - desbloqueando app")
                    self?.unlockApp()
                } else {
                    print("❌ Biometría falló: \(error?.localizedDescription ?? "Error desconocido")")
                    self?.showBiometricFailure()
                }
            }
        }
    }
    
    private func showFallbackAuthentication() {
        // Si no hay biometría, mostrar alerta con opción de reintentar
        let alert = UIAlertController(
            title: "Autenticación Requerida",
            message: "Por seguridad, necesitas autenticarte para continuar usando la app.",
            preferredStyle: .alert
        )
        
        alert.addAction(UIAlertAction(title: "Reintentar", style: .default) { [weak self] _ in
            self?.requestBiometricAuthentication()
        })
        
        alert.addAction(UIAlertAction(title: "Cerrar App", style: .destructive) { _ in
            exit(0)
        })
        
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let window = windowScene.windows.first {
            window.rootViewController?.present(alert, animated: true)
        }
    }
    
    private func showBiometricFailure() {
        let alert = UIAlertController(
            title: "Autenticación Fallida",
            message: "No se pudo verificar tu identidad. ¿Quieres intentar de nuevo?",
            preferredStyle: .alert
        )
        
        alert.addAction(UIAlertAction(title: "Reintentar", style: .default) { [weak self] _ in
            self?.requestBiometricAuthentication()
        })
        
        alert.addAction(UIAlertAction(title: "Cerrar App", style: .destructive) { _ in
            exit(0)
        })
        
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let window = windowScene.windows.first {
            window.rootViewController?.present(alert, animated: true)
        }
    }
    
    private func unlockApp() {
        isLocked = false
        // La app se desbloquea automáticamente al volver al foreground
    }
    
    // Método público para forzar el bloqueo (útil para testing)
    func forceLock() {
        backgroundTime = Date().addingTimeInterval(-lockThreshold - 1)
        appWillEnterForeground()
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
}
