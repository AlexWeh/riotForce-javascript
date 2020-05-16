import { LightningElement } from 'lwc';

export default class App extends LightningElement {
    apiKey = this.getCookie('apiKey');
    pName;
    depth;

    getCookie(cname) {
        var name = cname + '=';
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca = decodedCookie.split(';');

        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) === 0) {
                console.log('Cookie: ' + c);
                return c.substring(name.length, c.length);
            }
        }
        return 'test';
    }

    handleChange(event) {
        const field = event.target.name;
        if (field === 'pName') {
            this.pName = event.target.value;
        } else if (field === 'depth') {
            this.depth = event.target.value;
        } else if (field === 'apiKey') {
            document.cookie = 'apiKey=' + event.target.value;
            this.apiKey = event.target.value;
        }
    }

    handleGoButton() {
        if (this.pName !== '' && this.depth !== '') {
            console.log(
                'pName: ' +
                    this.pName +
                    '; depth: ' +
                    this.depth +
                    '; apiKey: ' +
                    this.apiKey
            );
            fetch(
                'http://localhost:3002/api/v1/endpoint?pName=' +
                    this.pName +
                    '&apiKey=' +
                    this.apiKey
            )
                .then((response) => console.log(response.json()))
                .catch((error) => error);
        }
    }

    // eslint-disable-next-line no-unused-vars
    loadTextField(event) {
        document.cookie = 'apiKey=test';
    }
}
