# Email Worker - Handles email sending via ActionMailer
# Preserves Ruby/ActionMailer for email templates and delivery

require 'json'
require 'action_mailer'

class EmailWorker
  def perform(mailer_class, mailer_method, *args)
    # Load Rails environment if available
    load_rails_env if defined?(Rails)

    # Dynamically call the mailer
    mailer = mailer_class.constantize
    mail = mailer.send(mailer_method, *args)

    if mail
      mail.deliver_now
      { success: true, message: "Email sent via #{mailer_class}##{mailer_method}" }
    else
      { success: false, message: "Mail not generated" }
    end
  rescue => e
    log_error(e)
    { success: false, error: e.message, backtrace: e.backtrace.first(5) }
  end

  private

  def load_rails_env
    require_relative '../../backend/config/environment'
  end

  def log_error(error)
    puts "[EmailWorker ERROR] #{error.class}: #{error.message}"
    error.backtrace.first(10).each { |line| puts "  #{line}" }
  end
end

# Specific email workers

class NotifyMessageWorker
  def perform(user_id, talk_id, message_id)
    user = User.find_by(id: user_id)
    talk = Talk.find_by(id: talk_id)

    return { skipped: true, reason: 'User or talk not found' } if user.blank? || talk.blank?

    unseen_message_item = talk.unread_talk_items(user)
                              .joins("inner join messages on messages.id = talk_items.talk_itemable_id and talk_items.talk_itemable_type = 'Message'")
                              .where.not(messages: { author_id: user_id })
                              .where('messages.id >= ?', message_id)
                              .where(replied_at: nil)
                              .order(:id)
                              .first

    return { skipped: true, reason: 'No unseen messages' } unless unseen_message_item

    Notifier.talk_messages(unseen_message_item.talk_itemable).deliver_now
    { success: true, message_id: message_id }
  end
end

class SendIntroWorker
  def perform(user_id, step)
    user = User.find_by(id: user_id)

    return { skipped: true } if user.blank? ||
                                 !user.email_verified? ||
                                 user.disabled_notifications.include?(:tips)

    UserNotifier.intro(user, step: step).deliver_now
    { success: true, user_id: user_id, step: step }
  end

  def self.perform_all!(time = Time.zone.now)
    perform_step(time, 1, 'first')
    perform_step(time, 24, 'second')
    perform_step(time, 48, 'third')
  end

  def self.perform_step(time, hours, step)
    User.active.register_date_since(hours, time).each do |user|
      # Queue the job
      require_relative '../queue'
      WorkerQueue.enqueue('SendIntroWorker', user.id, step)
    end
  end
end

class NotifyCommentEmailWorker
  def perform(comment_id, commentable_id)
    comment = Comment.find_by(id: comment_id)
    return { skipped: true } if comment.blank? || !comment.commentable.notify_comment?(comment.commentable_owner, comment)

    notifier_method = "#{comment.commentable_type.downcase}_commented"
    if CommentNotifier.respond_to?(notifier_method)
      CommentNotifier.send(notifier_method, comment).deliver_now
      { success: true, comment_id: comment_id }
    else
      { skipped: true, reason: "Notifier method not found: #{notifier_method}" }
    end
  end
end

class SendEngagementFavoritedWorker
  def perform(user_id)
    user = User.find_by(id: user_id)
    return { skipped: true } if user.blank?

    UserNotifier.engagement_favorited(user).deliver_now
    { success: true, user_id: user_id }
  end
end

class SendSuggestedServicesWorker
  def perform(user_id)
    user = User.find_by(id: user_id)
    return { skipped: true } if user.blank?

    UserNotifier.suggested_services(user).deliver_now
    { success: true, user_id: user_id }
  end
end
