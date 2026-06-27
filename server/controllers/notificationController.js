import Notification from "../models/Notification.js";

/**
 * @desc    Get all notifications for the logged-in user (newest first)
 * @route   GET /api/notifications
 * @access  Private
 */
export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark a single notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
export const markRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      res.status(404);
      throw new Error("Notification not found");
    }

    if (notification.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to modify this notification");
    }

    notification.read = true;
    const updated = await notification.save();

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all of the user's unread notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
export const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    );
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
export const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      res.status(404);
      throw new Error("Notification not found");
    }

    if (notification.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to delete this notification");
    }

    await notification.deleteOne();
    res.json({ id: req.params.id });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a notification for a user. Used elsewhere in the app (e.g. on
 * achievements or reminders). Must never throw fatally — failures are logged
 * but swallowed so they can't break the calling request.
 */
export const createNotification = async (
  userId,
  { title, body, type, link }
) => {
  try {
    const notification = await Notification.create({
      user: userId,
      title,
      body,
      type,
      link,
    });
    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
};