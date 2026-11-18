package __PACKAGE__.ui

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build

object PushChannels {
    const val MESSAGES = "messages"
    const val UPDATES = "updates"

    fun create(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(NotificationChannel(MESSAGES, "Messages", NotificationManager.IMPORTANCE_HIGH))
        manager.createNotificationChannel(NotificationChannel(UPDATES, "Updates", NotificationManager.IMPORTANCE_LOW))
    }
}
