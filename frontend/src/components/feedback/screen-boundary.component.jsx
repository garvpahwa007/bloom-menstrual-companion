import React from 'react';
import { Heart } from 'lucide-react';
class ScreenBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      failed: false
    };
  }
  static getDerivedStateFromError() {
    return {
      failed: true
    };
  }
  render() {
    const t = this.props.t;
    return this.state.failed ? <div className="card empty-state"><Heart size={32} /><h1>{t('error.title')}</h1><p>{t('error.body')}</p><button className="button primary" onClick={() => location.reload()}>{t('error.reload')}</button></div> : <div className="page-transition">{this.props.children}</div>;
  }
}
export default ScreenBoundary;
