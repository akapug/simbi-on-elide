# Notification Workers - Push notifications, SMS, and Slack
# Preserves Ruby for notification logic

require 'json'
require 'net/http'
require 'uri'

class NotificationWorker
  def log_info(message)
    puts "[NotificationWorker] #{message}"
  end

  def log_error(error)
    puts "[NotificationWorker ERROR] #{error.class}: #{error.message}"
    error.backtrace.first(10).each { |line| puts "  #{line}" }
  end
end

class SendPushWorker < NotificationWorker
  def perform(user_id, kind, message_content, data = {})
    user = User.find_by(id: user_id)
    return { skipped: true, reason: 'User not found' } if user.blank?

    # Check if user has push tokens
    return { skipped: true, reason: 'No push tokens' } if user.device_tokens.empty?

    # Send via push notification service (e.g., Firebase, OneSignal)
    send_push_notification(user, kind, message_content, data)
    { success: true, user_id: user_id, kind: kind }
  rescue => e
    log_error(e)
    { success: false, error: e.message }
  end

  private

  def send_push_notification(user, kind, message, data)
    # Implementation depends on push service (Firebase, OneSignal, etc.)
    user.device_tokens.each do |token|
      # Send to Firebase Cloud Messaging or similar
      log_info("Sending push to #{user.id}: #{message}")
    end
  end
end

class SendPushMessageWorker < NotificationWorker
  def perform(user_id, talk_id, message_id)
    user = User.find_by(id: user_id)
    talk = Talk.find_by(id: talk_id)
    message = Message.find_by(id: message_id)

    return { skipped: true } unless valid?(user, talk, message)
    return { skipped: true } if too_many_unread_messages?(talk, message, user) && message_too_old?(talk, message, user)

    data = {
      talk_id: talk.hash_id,
      url: Rails.application.routes.url_helpers.talk_url(talk),
      image: message.author.avatar(:thumb)
    }

    message_content = build_message_content(talk, message, user)

    SendPushWorker.new.perform(user.id, :messages, message_content, data)
  end

  private

  def valid?(user, talk, message)
    user.present? && talk.present? && message.present? && !talk.read_by?(user)
  end

  def build_message_content(talk, message, user)
    unreplied = unreplied_messages(talk, message, user)
    if unreplied.count.positive?
      I18n.t('push.talk.more_messages', first_name: message.author.first_name)
    else
      I18n.t('push.talk.message', first_name: message.author.first_name, message: message.content.truncate(50))
    end
  end

  def unreplied_messages(talk, message, user)
    last_item_id = talk.talk_histories.where(kind: 'created', user_id: user.id).last&.talk_item_id || 0
    talk.messages
        .where.not(author_id: user.id)
        .where('messages.id < ?', message.id)
        .where('talk_items.id > ?', last_item_id)
        .order(:created_at).to_a
  end

  def too_many_unread_messages?(talk, message, user)
    unreplied_messages(talk, message, user).count > 1
  end

  def message_too_old?(talk, message, user)
    unreplied = unreplied_messages(talk, message, user)
    return false if unreplied.empty?
    message.created_at - unreplied.last.created_at < 10.minutes
  end
end

class SendSmsWorker < NotificationWorker
  def perform(user_id, message)
    user = User.find_by(id: user_id)
    return { skipped: true } if user.blank? || user.phone.blank?

    send_via_twilio(user.phone, message)
    { success: true, user_id: user_id }
  rescue => e
    log_error(e)
    { success: false, error: e.message }
  end

  private

  def send_via_twilio(phone, message)
    # Twilio API integration
    account_sid = ENV['TWILIO_ACCOUNT_SID']
    auth_token = ENV['TWILIO_AUTH_TOKEN']
    from_number = ENV['TWILIO_PHONE_NUMBER']

    return unless account_sid && auth_token && from_number

    uri = URI.parse("https://api.twilio.com/2010-04-01/Accounts/#{account_sid}/Messages.json")

    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    request = Net::HTTP::Post.new(uri.path)
    request.basic_auth(account_sid, auth_token)
    request.set_form_data(
      'From' => from_number,
      'To' => phone,
      'Body' => message
    )

    response = http.request(request)
    log_info("SMS sent to #{phone}: #{response.code}")
  end
end

class SendSmsMessageWorker < NotificationWorker
  def perform(user_id, talk_id, message_id)
    user = User.find_by(id: user_id)
    talk = Talk.find_by(id: talk_id)
    message = Message.find_by(id: message_id)

    return { skipped: true } unless send_sms?(user, talk, message)

    yml_text = talk.service ? 'with_service' : 'no_service'
    sms_text = I18n.t("sms.new_message.#{yml_text}",
                      first_name: user.first_name,
                      sender_full_name: message.author.full_name,
                      sender_first_name: message.author.first_name,
                      listing_title: talk.service&.name,
                      talk_url: Rails.application.routes.url_helpers.talk_url(talk))

    SendSmsWorker.new.perform(user.id, sms_text)
  end

  private

  def send_sms?(user, talk, message)
    user.present? &&
      talk.present? &&
      message.present? &&
      !talk.read_by?(user) &&
      user.disabled_text_notifications.exclude?(:messages)
  end
end

class SlackNotifierWorker < NotificationWorker
  def perform(channel, user_id, message)
    user = User.find_by(id: user_id) if user_id
    send_slack_notification(channel, user, message)
    { success: true, channel: channel }
  rescue => e
    log_error(e)
    { success: false, error: e.message }
  end

  private

  def send_slack_notification(channel, user, message)
    webhook_url = ENV['SLACK_WEBHOOK_URL']
    return log_info("DEVELOPMENT: Slack message to #{channel}: #{message}") if ENV['RAILS_ENV'] == 'development'
    return unless webhook_url

    uri = URI.parse(webhook_url)
    payload = {
      channel: channel,
      username: user&.full_name_or_email || 'Simbi Bot',
      text: message,
      icon_url: user&.avatar&.url(:thumb)
    }

    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    request = Net::HTTP::Post.new(uri.path, 'Content-Type' => 'application/json')
    request.body = payload.to_json

    response = http.request(request)
    log_info("Slack notification sent to #{channel}: #{response.code}")
  end
end

class NotifyComplimentWorker < NotificationWorker
  def perform(compliment_id)
    compliment = Compliment.find_by(id: compliment_id)
    return { skipped: true } if compliment.blank?

    SendPushWorker.new.perform(
      compliment.user_id,
      :compliment,
      I18n.t('push.compliment', from: compliment.from_user.first_name)
    )
  end
end

class NotifyFavorWorker < NotificationWorker
  def perform(favor_id)
    favor = Favor.find_by(id: favor_id)
    return { skipped: true } if favor.blank?

    SendPushWorker.new.perform(
      favor.receiver_id,
      :favor,
      I18n.t('push.favor', from: favor.sender.first_name, service: favor.service.name)
    )
  end
end

class NotifyMatchWorker < NotificationWorker
  def perform(match_id)
    match = Match.find_by(id: match_id)
    return { skipped: true } if match.blank?

    SendPushWorker.new.perform(
      match.user_id,
      :match,
      I18n.t('push.match', from: match.matched_user.first_name)
    )
  end
end

class NotifyNewFollowerWorker < NotificationWorker
  def perform(follower_id, followed_id)
    follower = User.find_by(id: follower_id)
    followed = User.find_by(id: followed_id)
    return { skipped: true } if follower.blank? || followed.blank?

    SendPushWorker.new.perform(
      followed.id,
      :follower,
      I18n.t('push.new_follower', from: follower.first_name)
    )
  end
end
