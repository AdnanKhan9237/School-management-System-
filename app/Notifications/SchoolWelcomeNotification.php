<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SchoolWelcomeNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Tenant $tenant,
        private readonly string $loginUrl,
        private readonly ?string $temporaryPassword = null,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $message = (new MailMessage)
            ->subject('Welcome to '.$this->tenant->name.' on School Management SaaS')
            ->greeting('Welcome, '.$notifiable->name.'!')
            ->line('Your school "'.$this->tenant->name.'" has been created successfully.')
            ->line('Login email: '.$notifiable->email);

        if ($this->temporaryPassword !== null) {
            $message->line('Temporary password: '.$this->temporaryPassword)
                ->line('Please change your password after your first login.');
        }

        return $message
            ->action('Log in', $this->loginUrl)
            ->line('Thank you for choosing our platform!');
    }
}
