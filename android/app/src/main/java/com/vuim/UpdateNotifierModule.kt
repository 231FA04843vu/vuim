package com.vuim

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class UpdateNotifierModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  companion object {
    private const val CHANNEL_ID = "vuim_updates"
    private const val CHANNEL_NAME = "App Updates"
    private const val CHANNEL_DESCRIPTION = "Release and update notifications"
    private const val NOTIFICATION_ID = 1302
  }

  override fun getName(): String = "UpdateNotifier"

  @ReactMethod
  fun showUpdateNotification(title: String, message: String) {
    createChannelIfNeeded()

    val launchIntent =
        reactContext.packageManager
            .getLaunchIntentForPackage(reactContext.packageName)
            ?.apply {
              flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
              putExtra("initialRouteName", "Updates")
            }

    val pendingIntent =
        if (launchIntent != null) {
          PendingIntent.getActivity(
              reactContext,
              0,
              launchIntent,
              PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
          )
        } else {
          null
        }

    val builder =
        NotificationCompat.Builder(reactContext, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)

    if (pendingIntent != null) {
      builder.setContentIntent(pendingIntent)
    }

    NotificationManagerCompat.from(reactContext).notify(NOTIFICATION_ID, builder.build())
  }

  private fun createChannelIfNeeded() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }

    val manager = reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    val existing = manager.getNotificationChannel(CHANNEL_ID)
    if (existing != null) {
      return
    }

    val channel =
        NotificationChannel(CHANNEL_ID, CHANNEL_NAME, NotificationManager.IMPORTANCE_HIGH).apply {
          description = CHANNEL_DESCRIPTION
        }

    manager.createNotificationChannel(channel)
  }
}