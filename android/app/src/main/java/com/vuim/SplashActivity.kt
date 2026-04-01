package com.vuim

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.app.Activity
import com.lottiefiles.dotlottie.core.widget.DotLottieAnimation

class SplashActivity : Activity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_splash)

    val lottieView = findViewById<DotLottieAnimation>(R.id.lottie_view)
    lottieView.setLoop(true)
    lottieView.setSpeed(1.0f)
    lottieView.loadAnimation(
        "https://lottiefiles-mobile-templates.s3.amazonaws.com/ar-stickers/swag_sticker_piggy.lottie")
    lottieView.play()

    // Keep splash visible long enough for users to see the welcome animation.
    Handler(Looper.getMainLooper()).postDelayed({
      startActivity(Intent(this, MainActivity::class.java))
      finish()
    }, 2200)
  }
}
