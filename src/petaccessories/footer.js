import './css/footer.css'

var Footer = ()=>{
    return(
        <div className="footer-container container-fluid">
            <div className="container">
                <div className="row">
                    <div className="col-lg-4">
                        <div style={{ fontWeight: "bold", fontSize: "36px"}} className="section-title">EDEN</div>
                        <div className="normal-string">The one-stop solution for you pet’s needs. Giving your pet a happy life</div>
                    </div>
                    <div className="footer-section col-lg-4">
                        <div className="section-title">Quick Links</div>
                        <a href="/accessories/home" className="home footer-links">Home</a>
                        <a href="/accessories/cats" className="cats footer-links">Cats</a>
                        <a href="/accessories/dogs" className="dogs footer-links">Dogs</a>
                        <a href="/accessories/birds" className="birds footer-links">Birds</a>
                        <a href="/accessories/hamsters" className="hamsters footer-links">Hamsters</a>
                    </div>
                    <div className="footer-section col-lg-4">
                        <div className="section-title">Legal</div>
                        <a className="footer-links" href={ window.location}>Terms and Conditions</a>
                        <a className="footer-links" href={ window.location}>Privacy Policy</a>
                    </div>
                    <div className="col-sm-12 extra-info">
                        <div className="copy-write">© 2021 EDEN. All rights reserved.</div>
                        <a href={ window.location} className="back-to-top footer-links">Back to top</a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Footer;