import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getBooking, getBookingMessages, sendBookingMessage } from '../api/client';
import { Button } from '../components/UI/Button';
import type { Message, TripRecord } from '../types';

export function Messages() {
  const { bookingId } = useParams();
  const { user, token } = useAuth();
  const [booking, setBooking] = useState<TripRecord | null | undefined>(undefined);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bookingId || !token) return;
    getBooking(bookingId, token)
      .then(setBooking)
      .catch(() => setBooking(null));
    getBookingMessages(bookingId, token)
      .then(setMessages)
      .catch(() => setMessages([]));
  }, [bookingId, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!bookingId || booking === null) {
    return <Navigate to="/404" replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !body.trim()) return;
    setError('');
    setSending(true);
    try {
      const message = await sendBookingMessage(bookingId, body.trim(), token);
      setMessages((current) => [...current, message]);
      setBody('');
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const otherPartyName = booking && user
    ? booking.userId === user.id
      ? booking.listing.hostName
      : messages.find((message) => message.senderId !== user.id)?.senderName ?? 'Guest'
    : '';

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Link to="/profile" className="mb-6 inline-flex text-gray-600 hover:text-gray-900 transition-colors">
          ← Back to profile
        </Link>

        {booking === undefined ? (
          <p className="text-gray-600">Loading…</p>
        ) : (
          <>
            <div className="mb-6 flex items-center gap-4 rounded-2xl border border-gray-200 p-4">
              {booking.listing.image && (
                <img src={booking.listing.image} alt={booking.listing.title} className="h-16 w-20 rounded-lg object-cover" />
              )}
              <div>
                <p className="font-semibold text-gray-900">{booking.listing.title}</p>
                <p className="text-sm text-gray-600">
                  {booking.checkIn} → {booking.checkOut} · Conversation with {otherPartyName}
                </p>
              </div>
            </div>

            <div className="mb-4 flex h-96 flex-col gap-3 overflow-y-auto rounded-2xl border border-gray-200 p-4">
              {messages.length === 0 ? (
                <p className="m-auto text-sm text-gray-500">No messages yet. Say hello!</p>
              ) : (
                messages.map((message) => {
                  const isMine = message.senderId === user?.id;
                  return (
                    <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${isMine ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800'}`}>
                        {!isMine && <p className="mb-1 text-xs font-semibold opacity-70">{message.senderName}</p>}
                        <p>{message.body}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Write a message…"
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Button type="submit" disabled={sending || !body.trim()}>
                Send
              </Button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
