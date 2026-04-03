package com.vuim

import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Environment
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File

class InAppUpdateModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "InAppUpdate"

  @ReactMethod
  fun startApkDownload(url: String, promise: Promise) {
    try {
      val downloadManager =
          reactContext.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
      val fileName = "vuim-update-${System.currentTimeMillis()}.apk"

      val request =
          DownloadManager.Request(Uri.parse(url))
              .setTitle("VUIM update")
              .setDescription("Downloading latest update")
              .setAllowedOverMetered(true)
              .setAllowedOverRoaming(true)
              .setMimeType("application/vnd.android.package-archive")
              .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE)
              .setDestinationInExternalFilesDir(
                  reactContext,
                  Environment.DIRECTORY_DOWNLOADS,
                  fileName,
              )

      val id = downloadManager.enqueue(request)
      promise.resolve(id.toString())
    } catch (e: Exception) {
      promise.reject("DOWNLOAD_START_FAILED", e.message, e)
    }
  }

  @ReactMethod
  fun getDownloadProgress(downloadId: String, promise: Promise) {
    try {
      val id = downloadId.toLong()
      val downloadManager =
          reactContext.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
      val query = DownloadManager.Query().setFilterById(id)
      val cursor = downloadManager.query(query)

      if (!cursor.moveToFirst()) {
        cursor.close()
        promise.reject("DOWNLOAD_NOT_FOUND", "No active download for id=$downloadId")
        return
      }

      val status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))
      val downloaded =
          cursor.getLong(
              cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR),
          )
      val total =
          cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES))
      val localUri =
          cursor.getString(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_LOCAL_URI)) ?: ""
      cursor.close()

      val map = Arguments.createMap()
      map.putString("status", mapStatus(status))
      map.putDouble("bytesDownloaded", downloaded.toDouble())
      map.putDouble("totalBytes", total.toDouble())
      map.putInt(
          "progress",
          if (total > 0L) ((downloaded * 100L) / total).toInt().coerceIn(0, 100) else 0,
      )
      map.putString("localUri", localUri)

      promise.resolve(map)
    } catch (e: Exception) {
      promise.reject("DOWNLOAD_PROGRESS_FAILED", e.message, e)
    }
  }

  @ReactMethod
  fun installDownloadedApk(downloadId: String, promise: Promise) {
    try {
      val id = downloadId.toLong()
      val downloadManager =
          reactContext.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
      val query = DownloadManager.Query().setFilterById(id)
      val cursor = downloadManager.query(query)

      if (!cursor.moveToFirst()) {
        cursor.close()
        promise.reject("DOWNLOAD_NOT_FOUND", "No download for id=$downloadId")
        return
      }

      val status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))
      val localUri =
          cursor.getString(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_LOCAL_URI)) ?: ""
      cursor.close()

      if (status != DownloadManager.STATUS_SUCCESSFUL || localUri.isBlank()) {
        promise.reject("DOWNLOAD_NOT_READY", "Download is not ready to install")
        return
      }

      val filePath = Uri.parse(localUri).path ?: ""
      val file = File(filePath)
      if (!file.exists()) {
        promise.reject("APK_NOT_FOUND", "Downloaded APK file not found")
        return
      }

      val apkUri =
          FileProvider.getUriForFile(
              reactContext,
              "${reactContext.packageName}.fileprovider",
              file,
          )

      val intent =
          Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(apkUri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
          }

      reactContext.startActivity(intent)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("INSTALL_TRIGGER_FAILED", e.message, e)
    }
  }

  @ReactMethod
  fun cleanupDownloadedApk(downloadId: String, promise: Promise) {
    try {
      val id = downloadId.toLong()
      val downloadManager =
          reactContext.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager

      var localUri: String? = null
      val query = DownloadManager.Query().setFilterById(id)
      val cursor = downloadManager.query(query)
      if (cursor.moveToFirst()) {
        localUri =
            cursor.getString(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_LOCAL_URI))
      }
      cursor.close()

      downloadManager.remove(id)

      if (!localUri.isNullOrBlank()) {
        val filePath = Uri.parse(localUri).path
        if (!filePath.isNullOrBlank()) {
          val file = File(filePath)
          if (file.exists()) {
            file.delete()
          }
        }
      }

      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("CLEANUP_FAILED", e.message, e)
    }
  }

  private fun mapStatus(status: Int): String {
    return when (status) {
      DownloadManager.STATUS_PENDING -> "PENDING"
      DownloadManager.STATUS_RUNNING -> "RUNNING"
      DownloadManager.STATUS_PAUSED -> "PAUSED"
      DownloadManager.STATUS_SUCCESSFUL -> "SUCCESSFUL"
      DownloadManager.STATUS_FAILED -> "FAILED"
      else -> "UNKNOWN"
    }
  }
}
