const AppContent: React.FC = () => {
  const { state: authState, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<'main' | 'cadastros'>('main');
  const [profileOpen, setProfileOpen] = useState(false);

  if (!authState.isAuthenticated) return <LoginPage />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ...todo seu layout logado exatamente como está... */}
    </div>
  );
};
