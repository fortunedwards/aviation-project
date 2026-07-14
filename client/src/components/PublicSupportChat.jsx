import ChatWidget from './ChatWidget';

function PublicSupportChat() {
  let user = null;

  try {
    const parsed = JSON.parse(localStorage.getItem('user') || 'null');
    user = parsed?.role?.toLowerCase() === 'student' ? parsed : null;
  } catch (error) {
    user = null;
  }

  return <ChatWidget user={user} />;
}

export default PublicSupportChat;
