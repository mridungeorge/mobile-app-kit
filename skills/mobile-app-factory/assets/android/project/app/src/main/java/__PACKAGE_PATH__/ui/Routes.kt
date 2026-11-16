package __PACKAGE__.ui

/** Every route in one place, so a rename cannot leave a string behind. */
object Routes {
    const val HOME = "home"
    const val SETTINGS = "settings"
    const val AUTH = "auth"
    const val DELETE_ACCOUNT = "delete-account"
    const val DETAIL = "detail/{id}"

    fun detail(id: String) = "detail/$id"
}
