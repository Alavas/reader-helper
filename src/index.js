import React from 'react'
import ReactDOM from 'react-dom'
import './styles/index.css'
import Reader from './App'
import * as serviceWorker from './serviceWorker'

ReactDOM.render(<Reader />, document.getElementById('root'))
serviceWorker.register()
